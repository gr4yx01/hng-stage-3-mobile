import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

type Direction = "up" | "down" | "left" | "right";
type Animation = "idle" | "talk" | "fall" | "dance";
type AvatarType = "male" | "female";
interface Props {
  maleAnimation: Animation;
  femaleAnimation: Animation;
  onMaleMove: (direction: Direction) => void;
  onFemaleMove: (direction: Direction) => void;
  onMaleAnimationChange: (animation: Animation) => void;
  onFemaleAnimationChange: (animation: Animation) => void;
  onMaleReset: () => void;
  onFemaleReset: () => void;
  onLoadModel: (type: AvatarType, url: string) => void;
}

const FloatingControls: React.FC<Props> = ({
  maleAnimation,
  femaleAnimation,
  onMaleMove,
  onFemaleMove,
  onMaleAnimationChange,
  onFemaleAnimationChange,
  onMaleReset,
  onFemaleReset,
  onLoadModel,
}) => {
  const [activeAvatar, setActiveAvatar] = useState<AvatarType | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  const [loadedUrls, setLoadedUrls] = useState<{
    male?: string;
    female?: string;
  }>({});
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleLoadModel = () => {
    if (activeAvatar && modelUrl) {
      const otherAvatar = activeAvatar === "male" ? "female" : "male";
      if (loadedUrls[otherAvatar] === modelUrl) {
        alert("This model is already in use by the other avatar");
        return;
      }

      setLoadedUrls((prev) => ({
        ...prev,
        [activeAvatar]: modelUrl,
      }));

      onLoadModel(activeAvatar, modelUrl);
      setModelUrl("");
      setActiveAvatar(null);
    }
  };

  const renderControls = () => {
    const animation = activeAvatar === "male" ? maleAnimation : femaleAnimation;
    const onMove = activeAvatar === "male" ? onMaleMove : onFemaleMove;
    const onReset = activeAvatar === "male" ? onMaleReset : onFemaleReset;
    const onAnimationChange =
      activeAvatar === "male" ? onMaleAnimationChange : onFemaleAnimationChange;

    return (
      <View style={styles.controlsGrid}>
        <ControlSection title="Movement">
          <CompactDPad onMove={onMove} onReset={onReset} />
        </ControlSection>

        <ControlSection title="Animation">
          <AnimationSelector
            animation={animation}
            onAnimationChange={onAnimationChange}
          />
        </ControlSection>

        <ControlSection title="Load Model">
          <View style={styles.loadModelContainer}>
            <TextInput
              style={styles.urlInput}
              placeholder="Paste GLB model URL here"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={modelUrl}
              onChangeText={setModelUrl}
            />
            <TouchableOpacity
              style={styles.loadModelButton}
              onPress={handleLoadModel}
            >
              <Text style={styles.loadModelButtonText}>Load</Text>
            </TouchableOpacity>
          </View>
        </ControlSection>
      </View>
    );
  };

  return (
    <>
      <View style={styles.floatingButtonContainer}>
        {menuOpen && (
          <View style={styles.actionButtonsContainer}>
            <AvatarButton type="male" onPress={() => setActiveAvatar("male")} />
            <AvatarButton
              type="female"
              onPress={() => setActiveAvatar("female")}
            />
          </View>
        )}

        <FloatingButton
          onPress={() => setMenuOpen(!menuOpen)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          buttonScale={buttonScale}
          menuOpen={menuOpen}
        />
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={activeAvatar !== null}
        onRequestClose={() => setActiveAvatar(null)}
      >
        <TouchableWithoutFeedback onPress={() => setActiveAvatar(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  activeAvatar === "male"
                    ? styles.maleModal
                    : styles.femaleModal,
                ]}
              >
                <ModalHeader
                  type={activeAvatar as AvatarType}
                  onClose={() => setActiveAvatar(null)}
                />
                {renderControls()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const AvatarButton = ({
  type,
  onPress,
}: {
  type: AvatarType;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      type === "male" ? styles.maleButton : styles.femaleButton,
    ]}
    onPress={onPress}
  >
    <MaterialCommunityIcons
      name={type === "male" ? "face-man" : "face-woman"}
      size={24}
      color="white"
    />
  </TouchableOpacity>
);

const FloatingButton = ({
  onPress,
  onPressIn,
  onPressOut,
  buttonScale,
  menuOpen,
}: {
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  buttonScale: Animated.Value;
  menuOpen: boolean;
}) => (
  <Animated.View
    style={[styles.scaleContainer, { transform: [{ scale: buttonScale }] }]}
  >
    <TouchableOpacity
      style={styles.mainButton}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <MaterialIcons
        name={menuOpen ? "close" : "gamepad"}
        size={28}
        color="white"
      />
    </TouchableOpacity>
  </Animated.View>
);

const ModalHeader = ({
  type,
  onClose,
}: {
  type: AvatarType;
  onClose: () => void;
}) => (
  <View style={styles.modalHeader}>
    <View style={styles.modalTitleContainer}>
      <MaterialCommunityIcons
        name={type === "male" ? "face-man" : "face-woman"}
        size={24}
        color="white"
      />
      <Text style={styles.modalTitle}>
        {type === "male" ? "Male Avatar" : "Female Avatar"}
      </Text>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <MaterialIcons name="close" size={24} color="white" />
    </TouchableOpacity>
  </View>
);

const ControlSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.controlSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const CompactDPad = ({
  onMove,
  onReset,
}: {
  onMove: (direction: Direction) => void;
  onReset: () => void;
}) => {
  return (
    <View style={styles.dPad}>
      <TouchableOpacity
        style={[styles.dPadButton, styles.dPadUp]}
        onPress={() => onMove("up")}
      >
        <MaterialIcons name="arrow-upward" size={22} color="white" />
      </TouchableOpacity>

      <View style={styles.dPadMiddleRow}>
        <TouchableOpacity
          style={[styles.dPadButton, styles.dPadLeft]}
          onPress={() => onMove("left")}
        >
          <MaterialIcons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dPadCenter} onPress={onReset}>
          <MaterialIcons name="my-location" size={18} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dPadButton, styles.dPadRight]}
          onPress={() => onMove("right")}
        >
          <MaterialIcons name="arrow-forward" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.dPadButton, styles.dPadDown]}
        onPress={() => onMove("down")}
      >
        <MaterialIcons name="arrow-downward" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const AnimationSelector = ({
  animation,
  onAnimationChange,
}: {
  animation: Animation;
  onAnimationChange: (animation: Animation) => void;
}) => {
  const animations: Animation[] = ["idle", "talk", "fall", "dance"];

  return (
    <View style={styles.animationSelector}>
      {animations.map((anim) => (
        <TouchableOpacity
          key={anim}
          style={[
            styles.animationButton,
            animation === anim && styles.animationButtonActive,
          ]}
          onPress={() => onAnimationChange(anim)}
        >
          <MaterialCommunityIcons
            name={getAnimationIcon(anim) as any}
            size={20}
            color="white"
          />
          <Text style={styles.animationText}>{capitalize(anim)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const getAnimationIcon = (animation: Animation): string => {
  const icons = {
    idle: "human-greeting-variant",
    talk: "chat",
    fall: "hand-wave",
    dance: "human-handsup",
  };
  return icons[animation] || "account";
};

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const CompactAnimationSelector: React.FC<{
  animation: Animation;
  onAnimationChange: (animation: Animation) => void;
}> = ({ animation, onAnimationChange }) => {
  const animations: Animation[] = ["idle", "talk", "fall", "dance"];

  return (
    <View style={styles.animationSelector}>
      {animations.map((anim) => (
        <TouchableOpacity
          key={anim}
          style={[
            styles.animationButton,
            animation === anim && styles.animationButtonActive,
          ]}
          onPress={() => onAnimationChange(anim)}
        >
          <MaterialCommunityIcons
            name={getAnimationIcon(anim) as any}
            size={20}
            color="white"
          />
          <Text style={styles.animationText}>{capitalize(anim)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    alignItems: "flex-end",
  },
  scaleContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3a3af1",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  actionButtonsContainer: {
    marginBottom: 16,
    alignItems: "flex-end",
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  maleButton: {
    backgroundColor: "rgba(31, 58, 147, 0.8)",
  },
  femaleButton: {
    backgroundColor: "rgba(154, 18, 179, 0.8)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  maleModal: {
    backgroundColor: "rgba(16, 32, 92, 0.92)",
  },
  femaleModal: {
    backgroundColor: "rgba(92, 14, 120, 0.92)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  positionDisplay: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  positionLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 6,
  },
  positionValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  controlsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  controlSection: {
    width: "47%",
    minWidth: 150,
    flex: 1,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
  },
  dPadContainer: {
    alignItems: "center",
  },
  dPad: {
    alignItems: "center",
    justifyContent: "center",
    width: 160,
  },
  dPadMiddleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginVertical: 8,
  },
  dPadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(50, 90, 210, 0.8)",
    margin: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  dPadUp: {},
  dPadDown: {},
  dPadLeft: {},
  dPadRight: {},
  dPadCenter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(90, 90, 90, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  animationSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  animationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    width: "47%",
    marginBottom: 10,
  },
  animationButtonActive: {
    backgroundColor: "rgba(80, 120, 255, 0.6)",
  },
  animationText: {
    color: "white",
    fontSize: 14,
  },
  loadModelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  loadModelButtonText: {
    color: "white",
    fontSize: 14,
  },
  urlInputModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  urlInputModalContent: {
    width: "80%",
    backgroundColor: "rgba(50, 50, 50, 0.9)",
    padding: 20,
    borderRadius: 12,
  },
  urlInputTitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
  },
  urlInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  urlInputButton: {
    backgroundColor: "rgba(80, 120, 255, 0.6)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  urlInputButtonText: {
    color: "white",
    fontSize: 16,
  },
  loadModelContainer: {
    gap: 10,
  },
});

export default FloatingControls;
