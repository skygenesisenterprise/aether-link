// Core types for Aether Link client

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'operator' | 'user';
  permissions: Permission[];
  extensions: Extension[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  lastLogin?: Date;
  avatar?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  granted: boolean;
}

export interface Extension {
  id: string;
  number: string;
  type: 'sip' | 'iax2' | 'dahdi';
  userId: string;
  context: string;
  callerId: string;
  voicemail: VoicemailConfig;
  permissions: ExtensionPermission[];
  device?: DeviceConfig;
  status: 'online' | 'offline' | 'busy' | 'ringing';
  lastSeen?: Date;
}

export interface VoicemailConfig {
  enabled: boolean;
  password: string;
  email?: string;
  maxMessages: number;
  maxMessageLength: number;
  attachAudio: boolean;
  deleteAfterRead: boolean;
}

export interface DeviceConfig {
  userAgent: string;
  ipAddress: string;
  port: number;
  lastRegistered: Date;
  expires: number;
}

export interface ExtensionPermission {
  canMakeCalls: boolean;
  canReceiveCalls: boolean;
  canTransferCalls: boolean;
  canRecordCalls: boolean;
  allowedContexts: string[];
  maxConcurrentCalls: number;
}

export interface Trunk {
  id: string;
  name: string;
  type: 'sip' | 'iax2' | 'pri';
  host: string;
  port: number;
  auth: AuthConfig;
  codecs: string[];
  registration: RegistrationConfig;
  status: 'registered' | 'unregistered' | 'error' | 'registering';
  lastRegisterAttempt?: Date;
  callsInUse: number;
  maxCalls: number;
}

export interface AuthConfig {
  username: string;
  secret: string;
  realm?: string;
  authType: 'userpass' | 'md5' | 'rsa';
}

export interface RegistrationConfig {
  enabled: boolean;
  retryInterval: number;
  maxRetries: number;
  timeout: number;
}

export interface DialplanRule {
  id: string;
  context: string;
  extension: string;
  priority: number;
  application: string;
  parameters: string[];
  description: string;
  enabled: boolean;
  conditions?: RuleCondition[];
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'matches' | 'contains' | 'greater' | 'less';
  value: string;
  caseSensitive: boolean;
}

export interface Call {
  id: string;
  uniqueId: string;
  channel: string;
  direction: 'inbound' | 'outbound' | 'internal';
  callerId: string;
  callerNumber: string;
  destinationNumber: string;
  startTime: Date;
  answerTime?: Date;
  endTime?: Date;
  duration: number;
  status: 'ringing' | 'answered' | 'ended' | 'failed';
  disposition: 'answered' | 'no-answer' | 'busy' | 'failed';
  recording?: string;
  trunk?: string;
  context: string;
  userId?: string;
  extensionId?: string;
}

export interface Channel {
  id: string;
  uniqueId: string;
  name: string;
  state: 'down' | 'rsrvd' | 'offhook' | 'dialing' | 'ring' | 'remote' | 'up' | 'busy' | 'dialing-offhook' | 'pre-ring' | 'unknown';
  callerId: string;
  callerNumber: string;
  destinationNumber: string;
  accountCode?: string;
  context: string;
  extension?: string;
  linkedId?: string;
  creationTime: Date;
  duration: number;
  bridgedTo?: string;
  application?: string;
  applicationData?: string;
}

export interface Conference {
  id: string;
  name: string;
  context: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: ConferenceParticipant[];
  recording: boolean;
  muted: boolean;
  startTime: Date;
  endTime?: Date;
  pin?: string;
  adminPin?: string;
}

export interface ConferenceParticipant {
  id: string;
  channel: string;
  callerId: string;
  callerNumber: string;
  joinedTime: Date;
  muted: boolean;
  admin: boolean;
  talking: boolean;
}

export interface Queue {
  id: string;
  name: string;
  strategy: 'ringall' | 'roundrobin' | 'leastrecent' | 'fewestcalls' | 'random' | 'rrmemory' | 'linear';
  members: QueueMember[];
  callers: QueueCaller[];
  maxWaitTime: number;
  serviceLevel: number;
  weight: number;
  timeout: number;
  retry: number;
  wrapupTime: number;
}

export interface QueueMember {
  id: string;
  interface: string;
  memberName: string;
  state: 'static' | 'dynamic';
  penalty: number;
  paused: boolean;
  pausedReason?: string;
  lastCall?: Date;
  callsTaken: number;
  lastPause?: Date;
}

export interface QueueCaller {
  id: string;
  channel: string;
  callerId: string;
  callerNumber: string;
  waitTime: number;
  position: number;
  joinTime: Date;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    interfaces: NetworkInterface[];
    connections: number;
    bandwidth: {
      inbound: number;
      outbound: number;
    };
  };
  uptime: number;
  processes: number;
}

export interface NetworkInterface {
  name: string;
  status: 'up' | 'down';
  ipAddresses: string[];
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
}

export interface CDRRecord {
  id: string;
  uniqueId: string;
  source: string;
  destination: string;
  context: string;
  callerId: string;
  channel: string;
  destinationChannel: string;
  lastApplication: string;
  lastData: string;
  startTime: Date;
  answerTime?: Date;
  endTime: Date;
  duration: number;
  billableSeconds: number;
  disposition: string;
  amaFlags: string;
  userField?: string;
  accountCode?: string;
  recording?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  id?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalExtensions: number;
  activeExtensions: number;
  totalCalls: number;
  activeCalls: number;
  totalTrunks: number;
  activeTrunks: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger';
}