export interface KarabinerConfig {
  profiles: Profile[];
  global?: object;
  settings?: object;
}

export interface Profile {
  name: string;
  selected: boolean;
  complex_modifications: ComplexModifications;
  simple_modifications?: SimpleModification[];
  fn_function_keys?: object[];
  parameters?: object;
  devices?: DeviceOverride[];
  virtual_hid_keyboard?: VirtualHidKeyboard;
}

export interface ComplexModifications {
  rules: Rule[];
  parameters?: {
    [key: string]: any;
  };
}

export interface Rule {
  description: string;
  manipulators: Manipulator[];
}

export interface Manipulator {
  type: 'basic';
  from: From;
  to?: ToEvent[];
  to_if_alone?: ToEvent[];
  to_if_held_down?: ToEvent[];
  to_after_key_up?: ToEvent[];
  conditions?: Condition[];
  parameters?: {
    [key: string]: any;
  };
}

export interface From {
  key_code?: string;
  consumer_key_code?: string;
  pointing_button?: string;
  any?: string;
  simultaneous?: SimultaneousFromEvent[];
  simultaneous_options?: SimultaneousOptions;
  modifiers?: Modifiers;
}

export interface SimultaneousFromEvent {
  key_code?: string;
  consumer_key_code?: string;
  pointing_button?: string;
}

export interface SimultaneousOptions {
  detect_key_down_uninterruptedly?: boolean;
  key_down_order?: 'strict' | 'insensitive';
  key_up_order?: 'strict' | 'insensitive' | 'strict_if_held_down';
  key_up_when?: 'any' | 'all';
  to_after_key_up?: ToEvent[];
}

export interface ToEvent {
  key_code?: string;
  consumer_key_code?: string;
  pointing_button?: string;
  shell_command?: string;
  select_input_source?: object;
  set_variable?: object;
  mouse_key?: object;
  sticky_modifier?: object;
  software_function?: object;
  modifiers?: string[];
  halt?: boolean;
  lazy?: boolean;
  repeat?: boolean;
  hold_down_milliseconds?: number;
}

export interface Modifiers {
  mandatory?: string[];
  optional?: string[];
}

export interface Condition {
  type: 'frontmost_application_if' | 'frontmost_application_unless' | 'device_if' | 'device_unless' | 'keyboard_type_if' | 'keyboard_type_unless' | 'input_source_if' | 'input_source_unless' | 'variable_if' | 'variable_unless' | 'event_changed_if' | 'event_changed_unless';
  bundle_identifiers?: string[];
  file_paths?: string[];
  identifiers?: DeviceIdentifier[];
  keyboard_types?: string[];
  input_sources?: object[];
  name?: string;
  value?: any;
}

export interface DeviceIdentifier {
  vendor_id?: number;
  product_id?: number;
  description?: string;
  is_keyboard?: boolean;
  is_pointing_device?: boolean;
  is_touch_bar?: boolean;
  is_built_in_keyboard?: boolean;
  location_id?: number;
}

export interface SimpleModification {
  from: From;
  to: ToEvent[];
}

export interface DeviceOverride {
  identifiers: DeviceIdentifier;
  ignore?: boolean;
  manipulate_caps_lock_led?: boolean;
  disable_built_in_keyboard_if_exists?: boolean;
  simple_modifications?: SimpleModification[];
  fn_function_keys?: object[];
}

export interface VirtualHidKeyboard {
  country_code?: number;
  mouse_key_xy_scale?: number;
  indicate_sticky_modifier_keys_state?: boolean;
  keyboard_type_v2?: string;
}

export interface DevicePreset {
  name: string;
  description: string;
  vendor_id: number;
  product_id: number;
}
