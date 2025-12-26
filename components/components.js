import React from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal
} from 'react-native';
import { Sparkles, Check, SquareCheckBig   } from "lucide-react-native";


export const Theme = {
  colors: {
    primary: "#3136c5ff",
    secondary: "#696ceeff",
    background: "#c6ebfaff",
    surface: "#98e8f7ff",
    textMain: "#111827",
    textSecondary: "#696e78ff",
    border: "#95b3f0ff",
  },
  
  spacing: { sm: 8, md: 16, lg: 24, xl: 32 },
  radius: 12
};

// --- REUSABLE COMPONENTS ---

export const LogoHeader = ({ title, subtitle, style, titleStyle, subtitleStyle }) => (
  <View style={[styles.logoSection, style]}>
    <View style={styles.iconBadge}>
      <Sparkles size={32} color={Theme.colors.secondary} />
    </View>
    
    <Text style={[
      styles.title, 
      titleStyle // Apply external overrides
    ]}>
      {title}
    </Text>    
    
    <Text style={[
      styles.subtitle, 
      subtitleStyle
    ]}>
      {subtitle}
    </Text>
  </View>
);

export const MyInput = ({ label, icon: Icon, rightIcon: RightIcon, onRightIconPress, ...props }) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={styles.inputContainer}>
      {Icon && <Icon size={20} color={Theme.colors.textSecondary} />}
      <TextInput 
        style={[styles.input, { marginLeft: Icon ? 10 : 0 }]} 
        placeholderTextColor="#9ca3af"
        {...props} 
      />
      {RightIcon && (
        <TouchableOpacity onPress={onRightIconPress}>
          <RightIcon size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export const MyCheckbox = ({ label, checked, onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    activeOpacity={0.8} 
    style={styles.checkboxRow}
  >
    <View style={[
      styles.checkbox, 
      checked && styles.checkboxActive,
      { borderColor: checked ? Theme.colors.secondary : Theme.colors.border }
    ]}>
      {checked && <Check size={14} color="#fff" strokeWidth={3} />}
    </View>
    {label && <Text style={styles.grayText}>{label}</Text>}
  </TouchableOpacity>
);

export const MyButton = ({ title, onPress, type = 'primary', style }) => (
  <TouchableOpacity 
    style={[
      styles.btn, 
      { backgroundColor: type === 'primary' ? Theme.colors.primary : Theme.colors.secondary },
      style
    ]} 
    onPress={onPress}
  >
    <Text style={styles.btnText}>{title}</Text>
  </TouchableOpacity>
);

export const MyCustomAlert = ({ visible, title, message, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.alertOverlay}>
      <View style={styles.alertContainer}>
        <Text style={[styles.alertTitle]}>
          {title}
        </Text>
        <Text style={[styles.alertMessage]}>
          {message}
        </Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// --- STYLES ---

const styles = StyleSheet.create({
  logoSection: { alignItems: "center", marginBottom: 40 },
  iconBadge: { backgroundColor: "#f5f3ff", padding: 20, borderRadius: 24, marginBottom: 20 },
  title: { fontSize: 30,fontWeight: "bold", color: Theme.colors.textMain },
  subtitle: { fontSize: 20, color: Theme.colors.textSecondary, marginTop: 8, textAlign: "center" },
  btn: { paddingVertical: 16, borderRadius: Theme.radius, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  inputWrapper: { marginBottom: 20, width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textMain, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, borderRadius: Theme.radius, paddingHorizontal: 15, borderWidth: 1, borderColor: Theme.colors.border },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: Theme.colors.textMain },
 checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6, // Slightly more rounded for modern look
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
    transition: '0.2s', // Note: standard RN doesn't support transition, but this is the logic},    
},
checkboxActive: {backgroundColor: Theme.colors.secondary,},
    grayText: { color: Theme.colors.textSecondary, fontSize: 14 },

    alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  alertContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  alertTitle: { fontSize: 20, color: Theme.colors.textMain, marginBottom: 10 },
  alertMessage: { fontSize: 16, color: Theme.colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  alertButton: { 
    backgroundColor: Theme.colors.primary, 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 10 
  },
  alertButtonText: { color: '#fff', fontWeight: 'bold' }
});