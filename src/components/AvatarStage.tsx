import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mentorProfile } from '../data/mentorProfile';
import type { AvatarState } from '../types';

const AVATAR_FLOOR_Y = 0;
const FRAME_PAD_H = 1.06;
const FRAME_PAD_V = 1.05;
/** Push avatar lower in the stage (fraction of body height). */
const AVATAR_DROP_RATIO = 0.3;
/** Orbit pivot height on the body (0 = feet, 1 = head). */
const FOCUS_HEIGHT_RATIO = 0.58;
/** Y-axis yaw so the avatar faces the camera straight-on (radians). */
const AVATAR_FACE_Y = 0.14;
/** Shift rendered view so feet sit nearer the bottom badge. */
const VIEW_OFFSET_Y_RATIO = 0.06;
const IDLE_CLIP_NAME = 'IdleV4.2(maya_head)';

function pickStandingClip(clips: THREE.AnimationClip[]) {
  return (
    clips.find((c) => c.name === IDLE_CLIP_NAME) ||
    clips.find((c) => /idle/i.test(c.name)) ||
    clips.find((c) => /standing|stand|rest|neutral|breath/i.test(c.name)) ||
    clips[0]
  );
}

function pickTalkClip(clips: THREE.AnimationClip[]) {
  return (
    clips.find((c) => /teach|lecture|explain|present|coach|mentor/i.test(c.name)) ||
    clips.find((c) => /talk|speak|speech|chat|mouth/i.test(c.name))
  );
}

function scaleAvatarRoot(root: THREE.Object3D, viewportHeight: number) {
  root.scale.set(1, 1, 1);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const vh = viewportHeight || 500;
  const scaleTarget = Math.max(2.2, vh / 280);
  root.scale.setScalar(scaleTarget / maxDim);
}

function positionAvatarOnFloor(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const bottomY = box.min.y;

  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y = AVATAR_FLOOR_Y - bottomY - size.y * AVATAR_DROP_RATIO;
  root.rotation.set(0, AVATAR_FACE_Y, 0);
}

function frameAvatar(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControlsImpl | null,
  avatarRoot: THREE.Object3D,
  viewportWidth: number,
  viewportHeight: number,
) {
  camera.clearViewOffset();

  const box = new THREE.Box3().setFromObject(avatarRoot);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const ymin = box.min.y;
  const ymax = box.max.y;
  const fov = camera.fov * (Math.PI / 180);
  const tanHalf = Math.tan(fov / 2);

  const distH = (size.y * FRAME_PAD_V) / (2 * tanHalf);
  const distW = (size.x * FRAME_PAD_H) / (2 * tanHalf * camera.aspect);
  const distance = Math.max(distH, distW, 1.8);

  // Pivot around upper torso so face stays in frame while feet sit low.
  const focusY = ymin + (ymax - ymin) * FOCUS_HEIGHT_RATIO;
  const focus = new THREE.Vector3(center.x, focusY, center.z);

  camera.position.set(focus.x, focus.y, focus.z + distance);
  camera.lookAt(focus);
  camera.updateProjectionMatrix();

  const offsetY = Math.round(viewportHeight * VIEW_OFFSET_Y_RATIO);
  if (offsetY > 0) {
    camera.setViewOffset(
      viewportWidth,
      viewportHeight,
      0,
      offsetY,
      viewportWidth,
      viewportHeight,
    );
  }

  if (controls) {
    controls.target.copy(focus);
    controls.minDistance = distance * 0.45;
    controls.maxDistance = distance * 2.4;
    controls.update();
  }

  return { focus, distance };
}

type AvatarModelProps = {
  isSpeaking: boolean;
  onReady: (root: THREE.Object3D) => void;
};

function AvatarModel({ isSpeaking, onReady }: AvatarModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(mentorProfile.avatarFile);
  const { animations: gestureAnimations } = useGLTF('/animations.glb');
  const allAnimations = useMemo(
    () => [...animations, ...gestureAnimations],
    [animations, gestureAnimations],
  );
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const defaultActionRef = useRef<THREE.AnimationAction | null>(null);
  const talkActionRef = useRef<THREE.AnimationAction | null>(null);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  const avatarRootRef = useRef<THREE.Object3D | null>(null);
  const initializedRef = useRef(false);

  const fadeToAction = useCallback(
    (action: THREE.AnimationAction | null, duration = 0.35) => {
      if (!action || action === activeActionRef.current) return;
      if (activeActionRef.current) activeActionRef.current.fadeOut(duration);
      action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(duration).play();
      activeActionRef.current = action;
    },
    [],
  );

  useEffect(() => {
    if (!groupRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const avatarRoot = cloneSkinned(scene) as THREE.Object3D;
    groupRef.current.add(avatarRoot);
    avatarRootRef.current = avatarRoot;

    avatarRoot.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (allAnimations.length) {
      const mixer = new THREE.AnimationMixer(avatarRoot);
      mixerRef.current = mixer;

      const standingClip = pickStandingClip(allAnimations);
      const talkClip = pickTalkClip(allAnimations);

      defaultActionRef.current = mixer.clipAction(standingClip);
      defaultActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
      defaultActionRef.current.setEffectiveWeight(1);
      defaultActionRef.current.reset().play();
      activeActionRef.current = defaultActionRef.current;
      mixer.update(0);

      if (talkClip && talkClip !== standingClip) {
        talkActionRef.current = mixer.clipAction(talkClip);
      }
    }

    onReady(avatarRoot);
  }, [scene, allAnimations, onReady]);

  useEffect(() => {
    if (isSpeaking) {
      fadeToAction(talkActionRef.current || defaultActionRef.current, 0.3);
    } else {
      fadeToAction(defaultActionRef.current, 0.4);
      if (avatarRootRef.current) {
        avatarRootRef.current.rotation.y = AVATAR_FACE_Y;
      }
    }
  }, [isSpeaking, fadeToAction]);

  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  return <group ref={groupRef} />;
}

function AvatarLayout({
  avatarReady,
  avatarRoot,
  controlsRef,
}: {
  avatarReady: boolean;
  avatarRoot: React.RefObject<THREE.Object3D | null>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, size } = useThree();
  const layoutVersionRef = useRef(0);

  const applyLayout = useCallback(() => {
    const root = avatarRoot.current;
    if (
      !avatarReady ||
      !root ||
      !(camera instanceof THREE.PerspectiveCamera) ||
      size.height < 10
    ) {
      return;
    }

    scaleAvatarRoot(root, size.height);
    positionAvatarOnFloor(root);

    camera.aspect = size.width / size.height;
    frameAvatar(
      camera,
      controlsRef.current,
      root,
      size.width,
      size.height,
    );
  }, [avatarReady, avatarRoot, camera, controlsRef, size.height, size.width]);

  useEffect(() => {
    layoutVersionRef.current += 1;
    const version = layoutVersionRef.current;
    const frame = requestAnimationFrame(() => {
      if (version === layoutVersionRef.current) applyLayout();
    });
    return () => cancelAnimationFrame(frame);
  }, [applyLayout]);

  return null;
}

function AvatarScene({
  isSpeaking,
  avatarReady,
  onAvatarReady,
}: {
  isSpeaking: boolean;
  avatarReady: boolean;
  onAvatarReady: (root: THREE.Object3D) => void;
}) {
  const avatarRootRef = useRef<THREE.Object3D | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <>
      <ambientLight intensity={0.55} color="#fff8ee" />
      <directionalLight position={[2, 3, 2]} intensity={1.1} castShadow />
      <directionalLight position={[-2, 1, -2]} intensity={0.4} />
      <directionalLight position={[0, 0.5, 2]} intensity={0.35} />
      <AvatarModel
        isSpeaking={isSpeaking}
        onReady={(root) => {
          avatarRootRef.current = root;
          onAvatarReady(root);
        }}
      />
      <AvatarLayout
        avatarReady={avatarReady}
        avatarRoot={avatarRootRef}
        controlsRef={controlsRef}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        autoRotate={false}
        enableZoom
        zoomSpeed={0.9}
        rotateSpeed={0.85}
        minDistance={1}
        maxDistance={10}
      />
    </>
  );
}

type AvatarStageProps = {
  avatarState: AvatarState;
  isSpeaking: boolean;
};

export function AvatarStage({ avatarState, isSpeaking }: AvatarStageProps) {
  const [avatarReady, setAvatarReady] = useState(false);

  const statusLabel =
    avatarState === 'thinking'
      ? 'Thinking'
      : avatarState === 'speaking'
        ? 'Speaking'
        : 'Ready';

  const statusDotClass =
    avatarState === 'thinking'
      ? 'bg-white animate-pulse-dot'
      : avatarState === 'speaking'
        ? 'bg-success shadow-[0_0_8px_rgba(74,222,128,0.55)] animate-pulse-dot'
        : 'bg-text-muted';

  return (
    <aside className="relative flex h-full min-h-0 flex-col overflow-hidden border-l border-border-subtle bg-bg-base max-md:order-first max-md:border-l-0 max-md:border-b">
      <div className="z-10 flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-2.5">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Live Mentor
        </span>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-[rgba(8,9,12,0.72)] px-2.5 py-1 text-[0.68rem] text-text-secondary backdrop-blur-md">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
          {statusLabel}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-[#050505]">
          <div
            className="pointer-events-none absolute bottom-0 left-1/2 z-[1] h-[45%] w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center_bottom,rgba(255,255,255,0.06),transparent_70%)]"
            aria-hidden="true"
          />
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ fov: 34, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: true }}
            className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
            style={{ width: '100%', height: '100%' }}
          >
            <AvatarScene
              isSpeaking={isSpeaking}
              avatarReady={avatarReady}
              onAvatarReady={() => setAvatarReady(true)}
            />
          </Canvas>
        </div>

        <div className="pointer-events-none relative z-10 mx-auto -mt-5 mb-1 min-w-[12rem] rounded-full border border-white/12 bg-[rgba(18,18,18,0.92)] px-5 py-2.5 text-center backdrop-blur-md">
          <p className="text-base font-semibold tracking-wide text-text-primary">
            {mentorProfile.name}
          </p>
          <p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            {mentorProfile.role}
          </p>
        </div>
      </div>
    </aside>
  );
}

useGLTF.preload(mentorProfile.avatarFile);
useGLTF.preload('/animations.glb');
