import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Platform
} from 'react-native';
import { Sparkles, Check, ChevronRight } from "lucide-react-native";


export const Theme = {
  colors: {
    primary: "#4F46E5", // Indigo 600 - Confident, Calm
    secondary: "#818CF8", // Indigo 400 - Supportive
    background: "#F8FAFC", // Slate 50 - Clean, airy
    surface: "#FFFFFF", // White - Crisp
    textMain: "#1E293B", // Slate 800 - High contrast, soft black
    textSecondary: "#64748B", // Slate 500 - Readable subtle text
    border: "#E2E8F0", // Slate 200 - Soft borders
    success: "#10B981", // Emerald 500
    error: "#EF4444", // Red 500
    overlay: "rgba(15, 23, 42, 0.4)", // Slate 900 with opacity
  },

  typography: {
    header: "Poppins_600SemiBold",
    subHeader: "Poppins_500Medium",
    body: "Inter_400Regular",
    bodyBold: "Inter_600SemiBold",
  },

  spacing: { sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: 16, // More rounded for friendliness
  shadows: {
    sm: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    glow: {
      shadowColor: "#4F46E5",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    }
  }
};

// --- REUSABLE COMPONENTS ---

export const LogoHeader = ({ title, subtitle, style, titleStyle, subtitleStyle }) => (
  <View style={[styles.logoSection, style]}>
    <View style={styles.iconBadge}>
      <Sparkles size={32} color={Theme.colors.primary} />
    </View>

    <Text style={[
      styles.title,
      titleStyle
    ]}>
      {title}
    </Text>

    {subtitle && (
      <Text style={[
        styles.subtitle,
        subtitleStyle
      ]}>
        {subtitle}
      </Text>
    )}
  </View>
);

export const MyInput = ({ label, icon: Icon, rightIcon: RightIcon, onRightIconPress, ...props }) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.label}>{label}</Text>}

    <View style={[styles.inputContainer, props.value ? styles.inputContainerActive : null]}>
      {Icon && <View style={styles.inputIcon}><Icon size={20} color={Theme.colors.textSecondary} /></View>}

      <TextInput
        style={styles.input}
        placeholderTextColor="#94A3B8"
        selectionColor={Theme.colors.primary}
        {...props}
      />

      {RightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn}>
          <RightIcon size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export const MyCheckbox = ({ label, checked, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[styles.checkboxRow, checked && styles.checkboxRowActive]}
  >
    <View style={[
      styles.checkbox,
      checked && styles.checkboxActive,
    ]}>
      {checked && <Check size={14} color="#fff" strokeWidth={3} />}
    </View>
    {label && <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelActive]}>{label}</Text>}
  </TouchableOpacity>
);

export const MyButton = ({ title, onPress, type = 'primary', style }) => {
  const isPrimary = type === 'primary';
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnSecondary,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Text style={[styles.btnText, !isPrimary && styles.btnTextSecondary]}>{title}</Text>
    </TouchableOpacity>
  );
};

// --- REUSABLE COMPONENTS ---
import RNDateTimePicker from '@react-native-community/datetimepicker';

// ... other components

export const MyDatePicker = ({ label, value, onChange, icon: Icon }) => {
  const [show, setShow] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios'); // Keep open on iOS until confirmed (or close if style is simple)
    if (selectedDate) {
      // Format to YYYY-MM-DD for text display
      const dateStr = selectedDate.toISOString().split('T')[0];
      onChange(dateStr);
    }
    if (Platform.OS === 'android') {
      setShow(false);
    }
  };

  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.inputContainer, value ? styles.inputContainerActive : null]}
        onPress={() => setShow(true)}
      >
        {Icon && <View style={styles.inputIcon}><Icon size={20} color={Theme.colors.textSecondary} /></View>}
        <Text style={[styles.input, { textAlignVertical: 'center', paddingTop: 14 }]}>
          {value || "Select Date"}
        </Text>
      </TouchableOpacity>

      {show && (
        <RNDateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          themeVariant="light"
          accentColor={Theme.colors.primary}
        />
      )}
    </View>
  );

};

export const MyTimePicker = ({ label, value, onChange, icon: Icon }) => {
  const [show, setShow] = useState(false);

  const handleTimeChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      // Format to HH:MM for text display
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
    if (Platform.OS === 'android') {
      setShow(false);
    }
  };

  // Parse current value string (HH:MM) to Date object for the picker
  const getTimeObject = () => {
    if (!value) return new Date();
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.inputContainer, value ? styles.inputContainerActive : null]}
        onPress={() => setShow(true)}
      >
        {Icon && <View style={styles.inputIcon}><Icon size={20} color={Theme.colors.textSecondary} /></View>}
        <Text style={[styles.input, { textAlignVertical: 'center', paddingTop: 14 }]}>
          {value || "Select Time"}
        </Text>
      </TouchableOpacity>

      {show && (
        <RNDateTimePicker
          value={getTimeObject()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          themeVariant="light"
          accentColor={Theme.colors.primary}
          is24Hour={true}
        />
      )}
    </View>
  );
};

export const MyCustomAlert = ({ visible, title, message, onClose }) => (
  // ...
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
    <View style={styles.alertOverlay}>
      <View style={styles.alertContainer}>
        <View style={styles.alertIconBadge}>
          <Sparkles size={24} color={Theme.colors.primary} />
        </View>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>Okay</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// --- STYLES ---

const styles = StyleSheet.create({
  // Logo Header
  logoSection: {
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg
  },
  iconBadge: {
    backgroundColor: "#EEF2FF", // Very light indigo
    padding: 16,
    borderRadius: 24,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: "#E0E7FF"
  },
  title: {
    fontSize: 28,
    fontFamily: Theme.typography.header,
    color: Theme.colors.textMain,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 36
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: '85%'
  },

  // Input
  inputWrapper: { marginBottom: Theme.spacing.lg, width: '100%' },
  label: {
    fontSize: 14,
    fontFamily: Theme.typography.subHeader,
    color: Theme.colors.textMain,
    marginBottom: 8,
    marginLeft: 4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    height: 56, // Taller inputs for better touch target
    ...Theme.shadows.sm
  },
  inputContainerActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: "#F8FAFC"
  },
  inputIcon: { paddingLeft: 16 },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textMain
  },
  rightIconBtn: { paddingRight: 16 },

  // Checkbox / Option Card
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm
  },
  checkboxRowActive: {
    borderColor: Theme.colors.secondary,
    backgroundColor: "#F5F3FF" // Very light purple tint
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: Theme.colors.surface
  },
  checkboxActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textMain,
    flex: 1,
    lineHeight: 22
  },
  checkboxLabelActive: {
    color: Theme.colors.primary,
    fontFamily: Theme.typography.bodyBold,
  },

  // Button
  btn: {
    paddingVertical: 18,
    borderRadius: Theme.radius,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Theme.shadows.md
  },
  btnPrimary: {
    backgroundColor: Theme.colors.primary,
  },
  btnSecondary: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowOpacity: 0.05
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Theme.typography.subHeader,
    letterSpacing: 0.5
  },
  btnTextSecondary: {
    color: Theme.colors.textMain
  },

  // Alert
  alertOverlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  alertContainer: {
    width: '100%',
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    ...Theme.shadows.glow
  },
  alertIconBadge: {
    backgroundColor: "#F0Fdf4", // Light green or brand color
    padding: 12,
    borderRadius: 50,
    marginBottom: 16
  },
  alertTitle: {
    fontSize: 20,
    fontFamily: Theme.typography.header,
    color: Theme.colors.textMain,
    marginBottom: 8,
    textAlign: 'center'
  },
  alertMessage: {
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24
  },
  alertButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center'
  },
  alertButtonText: {
    color: '#fff',
    fontFamily: Theme.typography.subHeader,
    fontSize: 16
  }
});