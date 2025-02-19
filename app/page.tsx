import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Renderer } from 'expo-three';
import { Asset } from 'expo-asset';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Define types for the models and other variables
type LoadedModel = THREE.Object3D;

const GLBViewer: React.FC = () => {
  const glViewRef = useRef<GLView | null>(null);
  const [loadedModels, setLoadedModels] = useState<LoadedModel[]>([]);

  useEffect(() => {
    // Load both GLB models
    const loadGLBModels = async () => {
      const asset1 = Asset.fromModule(require('../assets/images/male.glb')); // First .glb file path
      const asset2 = Asset.fromModule(require('../assets/images/female.glb')); // Second .glb file path

      await Promise.all([asset1.downloadAsync(), asset2.downloadAsync()]); // Wait for both models to be loaded

      const loader = new GLTFLoader();
      loader.load(
        asset1.localUri as string,
        (gltf: any) => {
          setLoadedModels((prevModels) => [...prevModels, gltf.scene]);
        },
        undefined,
        (error: any) => console.error('Error loading first model:', error)
      );
      loader.load(
        asset2.localUri as string,
        (gltf: any) => {
          setLoadedModels((prevModels) => [...prevModels, gltf.scene]);
        },
        undefined,
        (error: any) => console.error('Error loading second model:', error)
      );
    };

    loadGLBModels();
  }, []);

  // Animation logic (optional)
  const animateModels = (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: Renderer, deltaTime: number) => {
    loadedModels.forEach((model) => {
      if (model) {
        model.rotation.y += deltaTime * 0.5; // Rotate models
      }
    });

    renderer.render(scene, camera);
  };

  const onContextCreate = async (gl: WebGLRenderingContext) => {
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);
    camera.position.z = 5;

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    // Add the loaded models to the scene and position them
    if (loadedModels.length >= 2) {
      const model1 = loadedModels[0];
      const model2 = loadedModels[1];

      // Position the models on opposite sides
      model1.position.set(-2, 0, 0);  // Move the first model to the left
      model2.position.set(2, 0, 0);   // Move the second model to the right

      // Make the models face each other using lookAt (model1 faces model2 and vice versa)
      model1.lookAt(model2.position);  // Model 1 faces model 2
      model2.lookAt(model1.position);  // Model 2 faces model 1

      // Add both models to the scene
      scene.add(model1);
      scene.add(model2);
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - (lastTime || now);
      lastTime = now;

      animateModels(scene, camera, renderer, deltaTime / 1000);

      gl.flush();
      requestAnimationFrame(animate);
    };

    let lastTime: number;
    animate();
  };

  return (
    <View style={styles.container}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
        ref={glViewRef}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glView: {
    width: '100%',
    height: '100%',
  },
});

export default GLBViewer;
