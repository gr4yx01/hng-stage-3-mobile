import { OrbitControls, useTexture, useGLTF } from "@react-three/drei/native";
import { Canvas } from "@react-three/fiber/native";
import React, { Suspense, useRef, useState } from "react";
import {
  ActivityIndicator,
  LogBox,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Avatar from "./src/Avatar";
import ControlsOverlay from "./src/ControlsOverlay";

LogBox.ignoreAllLogs();

type Animation = "idle" | "talk" | "fall" | "dance";
type Direction = "left" | "right" | "up" | "down";
type AvatarType = "male" | "female";

interface AvatarState {
  position: [number, number, number];
  rotation: [number, number, number];
  facing: Direction;
  animation: Animation;
  modelPath?: string;
}

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

function Scene({
  maleState,
  femaleState,
}: {
  maleState: AvatarState;
  femaleState: AvatarState;
}) {
  const [texture, normalMap, aoMap, roughnessMap] = useTexture([
    require("./assets/textures/metal-diffuse.jpg"),
    require("./assets/textures/metal-normal-gl.jpg"),
    require("./assets/textures/metal-ao.jpg"),
    require("./assets/textures/metal-rough.jpg"),
  ]);

  return (
    <>
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.3, 64]} />
        <meshStandardMaterial
          map={texture}
          normalMap={normalMap}
          aoMap={aoMap}
          roughnessMap={roughnessMap}
          roughness={0.6}
          metalness={0.8}
        />
      </mesh>

      <Avatar
        modelPath={
          maleState.modelPath || require("./assets/3d/avatar-male.glb")
        }
        state={maleState}
        avatarType="male"
      />
      <Avatar
        modelPath={
          femaleState.modelPath || require("./assets/3d/avatar-female.glb")
        }
        state={femaleState}
        avatarType="female"
      />

      <ambientLight intensity={1.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        zoomSpeed={0.6}
        enabled
      />
    </>
  );
}

export default function App() {
  const [maleState, setMaleState] = useState<AvatarState>({
    position: [-0.5, -1, 0],
    rotation: [0, Math.PI / 2, 0],
    facing: "right",
    animation: "idle",
  });

  const [femaleState, setFemaleState] = useState<AvatarState>({
    position: [0.5, -1, 0],
    rotation: [0, -Math.PI / 2, 0],
    facing: "left",
    animation: "idle",
  });

  // A key to force reloading (remounting) the entire Canvas and its children.
  const [sceneReloadKey, setSceneReloadKey] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const maleMovementEnabled = useRef(true);
  const femaleMovementEnabled = useRef(true);

  const handleDirectionChange = (isMale: boolean, direction: Direction) => {
    const currentState = isMale ? maleState : femaleState;
    const setState = isMale ? setMaleState : setFemaleState;
    const movementEnabled = isMale
      ? maleMovementEnabled
      : femaleMovementEnabled;

    if (currentState.facing === direction && movementEnabled.current) {
      moveAvatar(isMale, direction);
    } else {
      setState({
        ...currentState,
        facing: direction,
      });

      movementEnabled.current = false;
      setTimeout(() => {
        movementEnabled.current = true;
      }, 300);
    }
  };

  const moveAvatar = (isMale: boolean, direction: Direction) => {
    const currentState = isMale ? maleState : femaleState;
    const setState = isMale ? setMaleState : setFemaleState;
    const currentPos = [...currentState.position];
    const speed = 0.3;

    switch (direction) {
      case "left":
        currentPos[0] -= speed;
        break;
      case "right":
        currentPos[0] += speed;
        break;
      case "up":
        currentPos[2] -= speed;
        break;
      case "down":
        currentPos[2] += speed;
        break;
    }

    setState({
      ...currentState,
      position: currentPos as [number, number, number],
    });
  };

  const resetAvatarPosition = (isMale: boolean) => {
    const defaultFacing = "up";
    if (isMale) {
      setMaleState({
        position: [-0.5, -1, 0],
        rotation: getRotationForDirection(defaultFacing),
        facing: defaultFacing,
        animation: maleState.animation,
      });
    } else {
      setFemaleState({
        position: [0.5, -1, 0],
        rotation: getRotationForDirection(defaultFacing),
        facing: defaultFacing,
        animation: femaleState.animation,
      });
    }
  };

  const handleAnimationChange = (isMale: boolean, animation: Animation) => {
    if (!animation) {
      console.error('Invalid animation type');
      return;
    }
  
    if (isMale) {
      setMaleState({
        ...maleState,
        animation,
      });
    } else {
      setFemaleState({
        ...femaleState,
        animation,
      });
    }
  };
  
  const handleLoadModel = (type: AvatarType, url: string) => {
    if (url && typeof url === 'string') {  // Ensure url is defined and a string
      if (type === "male") {
        setMaleState({
          ...maleState,
          modelPath: url,
        });
      } else {
        setFemaleState({
          ...femaleState,
          modelPath: url,
        });
      }
      setSceneReloadKey((prevKey) => prevKey + 1);
    } else {
      console.error('Invalid model path provided', url);
    }
  };
  

  return (
    <View style={styles.container}>
      <Canvas
        key={sceneReloadKey} // updating the key forces the whole scene to remount.
        camera={{ position: [0, 1.5, 3], fov: 60 }}
        onCreated={() => setIsLoading(false)}
      >
        <Suspense fallback={null}>
          <Scene maleState={maleState} femaleState={femaleState} />
        </Suspense>
      </Canvas>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e7eff" />
          <Text style={styles.loadingText}>Loading Scene...</Text>
        </View>
      )}

      <ControlsOverlay
        maleAnimation={maleState.animation}
        femaleAnimation={femaleState.animation}
        onMaleMove={(direction) => handleDirectionChange(true, direction)}
        onFemaleMove={(direction) => handleDirectionChange(false, direction)}
        onMaleAnimationChange={(animation) =>
          handleAnimationChange(true, animation)
        }
        onFemaleAnimationChange={(animation) =>
          handleAnimationChange(false, animation)
        }
        onMaleReset={() => resetAvatarPosition(true)}
        onFemaleReset={() => resetAvatarPosition(false)}
        onLoadModel={handleLoadModel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "pink",
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  controlGroup: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 20,
    width: "48%",
  },
  labelText: {
    color: "white",
    marginBottom: 5,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#4e7eff",
    padding: 15,
    margin: 5,
    borderRadius: 10,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    backgroundColor: "#ff6b6b",
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
