import { useAnimations, useGLTF } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import { useEffect, useRef } from "react";
import type { Group } from "three";

type Animation = "idle" | "talk" | "fall" | "dance";
type Direction = "left" | "right" | "up" | "down";

interface AvatarState {
  position: [number, number, number];
  rotation: [number, number, number];
  facing: Direction;
  animation: Animation;
}

interface AvatarProps {
  modelPath: string;
  state: AvatarState;
  avatarType: "male" | "female";
}

const MALE_ANIMATIONS = {
  idle: require("../assets/3d/M_Standing_Idle_001.glb"),
  talk: require("../assets/3d/M_Talking_Variations_004.glb"),
  fall: require("../assets/3d/M_Falling_Idle_001.glb"),
  dance: require("../assets/3d/M_Dances_001.glb"),
};

const FEMALE_ANIMATIONS = {
  idle: require("../assets/3d/F_Standing_Idle_001.glb"),
  talk: require("../assets/3d/F_Talking_Variations_004.glb"),
  fall: require("../assets/3d/F_Falling_Idle_001.glb"),
  dance: require("../assets/3d/F_Dances_001.glb"),
};

[
  require("../assets/3d/avatar-male.glb"),
  require("../assets/3d/avatar-female.glb"),
  ...Object.values(MALE_ANIMATIONS),
  ...Object.values(FEMALE_ANIMATIONS),
].forEach((path) => useGLTF.preload(path));

const getAnimationFile = (isMale: boolean, animation: Animation) => {
  return isMale ? MALE_ANIMATIONS[animation] : FEMALE_ANIMATIONS[animation];
};

const getAnimationClipName = (animation: Animation): string => {
  switch (animation) {
    case "talk":
      return "talking";
    case "dance":
      return "dance";
    case "fall":
      return "falling";
    case "idle":
      return "idle";
    default:
      return "idle";
  }
};

const getRotationForDirection = (
  direction: Direction
): [number, number, number] => {
  switch (direction) {
    case "left":
      return [0, -Math.PI / 2, 0];
    case "right":
      return [0, Math.PI / 2, 0];
    case "up":
      return [0, Math.PI, 0];
    case "down":
      return [0, 0, 0];
    default:
      return [0, 0, 0];
  }
};

function Avatar({ modelPath, state, avatarType }: AvatarProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(modelPath) as any;

  const isMale = avatarType === "male";
  const animationFile = getAnimationFile(isMale, state.animation);
  // Always use the animation files we have, regardless of custom model
  const { animations } = useGLTF(animationFile) as any;

  const { actions, names } = useAnimations(animations, group);
  const targetRotation = useRef<[number, number, number]>(state.rotation);
  const currentRotation = useRef<[number, number, number]>(state.rotation);
  const isRotating = useRef(false);

  useEffect(() => {
    if (!actions || !state.animation) return;

    const clipPattern = getAnimationClipName(state.animation);

    const animationName = names.find((name: string) =>
      name.toLowerCase().includes(clipPattern.toLowerCase())
    );

    if (animationName && actions[animationName]) {
      names.forEach((name: string) => {
        if (name !== animationName && actions[name]) {
          actions[name].fadeOut(0.3);
        }
      });

      actions[animationName].reset().fadeIn(0.3).play();

      return () => {
        if (actions[animationName]) {
          actions[animationName].fadeOut(0.3);
        }
      };
    } else {
      console.log(`Animation not found: ${clipPattern} in ${names.join(", ")}`);
    }
  }, [state.animation, actions, names]);

  useEffect(() => {
    targetRotation.current = getRotationForDirection(state.facing);
    isRotating.current = true;
  }, [state.facing]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.position.set(...state.position);

      if (isRotating.current) {
        const rotSpeed = 5 * delta;
        const [targetX, targetY, targetZ] = targetRotation.current;
        const [currentX, currentY, currentZ] = currentRotation.current;

        let diffY = targetY - currentY;
        if (diffY > Math.PI) diffY -= 2 * Math.PI;
        if (diffY < -Math.PI) diffY += 2 * Math.PI;

        const newY = currentY + diffY * rotSpeed;
        currentRotation.current = [currentX, newY, currentZ];

        if (Math.abs(diffY) < 0.01) {
          isRotating.current = false;
          currentRotation.current = targetRotation.current;
        }

        group.current.rotation.set(...currentRotation.current);
      } else {
        group.current.rotation.set(...currentRotation.current);
      }
    }
  });

  return (
    <group ref={group} dispose={null} position={state.position}>
      <primitive object={scene} scale={[0.8, 0.8, 0.8]} />
    </group>
  );
}

export default Avatar;
