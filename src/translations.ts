export type Language = 'en' | 'es';

export interface TranslationKeys {
  dailyDispatch: string;
  assignmentsDesc: string;
  morning: string;
  afternoon: string;
  selectedDate: string;
  guardiaGroup: string;
  shift8h: string;
  shift24h: string;
  offDuty: string;
  personnelRegistry: string;
  availabilityFilter: string;
  validCount: string;
  name: string;
  guardia: string;
  collabs: string;
  status: string;
  noPersonnel: string;
  databaseEmpty: string;
  eligible8h: string;
  eligibleShift: string;
  edBlock: string;
  maxCollab: string;
  conflict24h: string;
  selectionTitle: string;
  selectionDesc: string;
  generatedText: string;
  generateBtn: string;
  generatingBtn: string;
  dispatchCommitted: string;
  systemStatus: string;
  adminMode: string;
  onboardTitle: string;
  onboardDesc: string;
  registryDatabase: string;
  all: string;
  onboardHeader: string;
  personnelRoster: string;
  commaSeparated: string;
  groupLabel: string;
  edLabel: string;
  edDesc: string;
  registerBtn: string;
  processingBtn: string;
  maxThreshold: string;
  emergencyDept: string;
  overridden: string;
  limitMarker: string;
  settingMaxcollabsLabel: string;
  settingMaxcollabsDesc: string;
  settingSaveSuccess: string;
  settingSaveBtn: string;
  settingSavingBtn: string;
  setEd: string;
  edActive: string;
  overrideLimit: string;
  overrideOn: string;
  deletePersonnel: string;
  confirm: string;
  cancel: string;
  systemAdmin: string;
  adminDesc: string;
  authorizeTitle: string;
  userUid: string;
  uidHint: string;
  officialEmail: string;
  authorizeBtn: string;
  authorizingBtn: string;
  advisoryTitle: string;
  advisoryDesc: string;
  operationalStatus: string;
  dbEngine: string;
  secure: string;
  encryption: string;
  aes256: string;
  dispatchHistory: string;
  historyDesc: string;
  deploymentLogs: string;
  personnelCount: string;
  certified: string;
  pending: string;
  auditLog: string;
  statusCode: string;
  certifyInstruction: string;
  unknownId: string;
  certifyBtn: string;
  logFinalized: string;
  logFinalizedDesc: string;
  adminAuthRequired: string;
  contactAdminDesc: string;
  selectLogPrompt: string;
  dashboard: string;
  history: string;
  adminSettings: string;
  signOut: string;
  adminLoginTitle: string;
  adminLoginDesc: string;
  emailLabel: string;
  passwordLabel: string;
  loginBtn: string;
  signUpLink: string;
  loginLink: string;
  signUpBtn: string;
  alertTitle: string;
  alertDesc: string;
  deleteLogBtn: string;
  confirmDeleteLog: string;
  deleteFailed: string;
  successAdminCreated: string;
  failedAdminCreated: string;
  noLogsGenerated: string;
  languageSelector: string;
}

export const translations: Record<Language, TranslationKeys> = {
  en: {
    dailyDispatch: "Daily Dispatch",
    assignmentsDesc: "Assignments are generated once and timestamped for validity.",
    morning: "Morning",
    afternoon: "Afternoon",
    selectedDate: "Selected Date",
    guardiaGroup: "Guardia {team}",
    shift8h: "8H SHIFT",
    shift24h: "24H ACTIVE",
    offDuty: "OFF-DUTY",
    personnelRegistry: "Personnel Registry",
    availabilityFilter: "Availability filtered by shift & collab thresholds",
    validCount: "{count} Valid",
    name: "Name",
    guardia: "Guardia",
    collabs: "Collabs",
    status: "Status",
    noPersonnel: "No personnel found.",
    databaseEmpty: "Database is empty. Personnel required.",
    eligible8h: "8H Eligible",
    eligibleShift: "Shift Eligible",
    edBlock: "ED Block",
    maxCollab: "Max Collab",
    conflict24h: "24H Conflict",
    selectionTitle: "Selection {type}",
    selectionDesc: "Ranked priority for collaboration assignments",
    generatedText: "Generated: {time}",
    generateBtn: "Generate selection queue",
    generatingBtn: "Generating Authorized Dispatch...",
    dispatchCommitted: "Dispatch Committed",
    systemStatus: "System Status: CALIBRATED // DATABASE: ACTIVE",
    adminMode: "Admin Mode Enabled",
    onboardTitle: "Personnel Registry",
    onboardDesc: "Onboard and manage personnel and their rotation groups.",
    registryDatabase: "Registry Database",
    all: "All",
    onboardHeader: "Onboard Personnel",
    personnelRoster: "Personnel Roster",
    commaSeparated: "Comma or line-separated",
    groupLabel: "Assigned Guardia Group",
    edLabel: "Emergency Dept",
    edDesc: "Always ineligible for selection",
    registerBtn: "Register Personnel",
    processingBtn: "Processing Roster...",
    maxThreshold: "Max Threshold",
    emergencyDept: "Emergency Dept",
    overridden: "OVERRIDDEN",
    limitMarker: "Limit: {limit}",
    settingMaxcollabsLabel: "Maximum Collaboration Limit",
    settingMaxcollabsDesc: "The maximum number of times any personnel is allowed to participate in collaborations before being blocked.",
    settingSaveSuccess: "System settings updated successfully.",
    settingSaveBtn: "Save Settings",
    settingSavingBtn: "Saving Settings...",
    setEd: "Set ED",
    edActive: "ED Active",
    overrideLimit: "Override Limit",
    overrideOn: "Override On",
    deletePersonnel: "Delete personnel",
    confirm: "Confirm",
    cancel: "Cancel",
    systemAdmin: "System Administration",
    adminDesc: "Manage elevated privileges and system configurations.",
    authorizeTitle: "Authorize New Admin",
    userUid: "User UID",
    uidHint: "The user can find their UID in their profile section.",
    officialEmail: "Official Email",
    authorizeBtn: "Authorize Admin",
    authorizingBtn: "Authorizing...",
    advisoryTitle: "Pre-deployment Advisory",
    advisoryDesc: "Authorized administrators have full write/delete access across the entire registry. Ensure UIDs are verified before granting administrative status.",
    operationalStatus: "Operational Status",
    dbEngine: "Database Engine",
    secure: "SECURE",
    encryption: "Encryption Layer",
    aes256: "AES-256",
    dispatchHistory: "Dispatch History",
    historyDesc: "Review operational logs and certify actual collaborations for record tracking.",
    deploymentLogs: "Deployment Logs",
    personnelCount: "Personnel count: {count}",
    certified: "Certified",
    pending: "Pending",
    auditLog: "Audit Log",
    statusCode: "Status Code",
    certifyInstruction: "Certify members who effectively engaged in collaboration for threshold accrual:",
    unknownId: "Unknown Identification",
    certifyBtn: "CERTIFY DEPLOYMENT",
    logFinalized: "Operational Log Finalized",
    logFinalizedDesc: "Activity metrics have been successfully pushed to personnel records.",
    adminAuthRequired: "Admin Authorization Required",
    contactAdminDesc: "Contact a system administrator to certify this operational log.",
    selectLogPrompt: "Select a deployment vector from the log queue to review details and certify collaboration events.",
    dashboard: "Dashboard",
    history: "History Logs",
    adminSettings: "Admin Settings",
    signOut: "Sign Out",
    adminLoginTitle: "Centralized Login",
    adminLoginDesc: "Centralized login coordinates authenticated administrative functions securely.",
    emailLabel: "Official Email Address",
    passwordLabel: "Password Credentials",
    loginBtn: "Authenticate Securely",
    signUpLink: "Do not have an administrative account? Sign Up",
    loginLink: "Already have an administrative account? Login",
    signUpBtn: "Register Administrative ID",
    alertTitle: "Non-AI Execution Guarantee",
    alertDesc: "This dispatcher operates entirely via deterministic shuffle algorithms mapped against Guardia cyclic indexes. No AI models or non-deterministic integrations are utilized during queue generation.",
    deleteLogBtn: "Delete Log Entries",
    confirmDeleteLog: "Are you sure you want to permanently delete this dispatch log?",
    deleteFailed: "Delete failed",
    successAdminCreated: "Admin record created successfully.",
    failedAdminCreated: "Failed to add admin. Check permissions.",
    noLogsGenerated: "No logs generated.",
    languageSelector: "Language / Idioma"
  },
  es: {
    dailyDispatch: "Despacho Diario",
    assignmentsDesc: "Las asignaciones se generan una sola vez y se registran con marca de tiempo para su validez.",
    morning: "Mañana",
    afternoon: "Tarde",
    selectedDate: "Fecha Seleccionada",
    guardiaGroup: "Guardia {team}",
    shift8h: "TURNO DE 8H",
    shift24h: "24H ACTIVO",
    offDuty: "FUERA DE SERVICIO",
    personnelRegistry: "Registro de Personal",
    availabilityFilter: "Disponibilidad filtrada por turno y límites de colab.",
    validCount: "{count} Válidos",
    name: "Nombre",
    guardia: "Guardia",
    collabs: "Colabs.",
    status: "Estado",
    noPersonnel: "No se encontraron personas.",
    databaseEmpty: "La base de datos está vacía. Se requiere personal.",
    eligible8h: "Elegible 8H",
    eligibleShift: "Elegible Turno",
    edBlock: "Bloqueo Urgencias",
    maxCollab: "Colabs. Máx",
    conflict24h: "Conflicto 24H",
    selectionTitle: "Selección de la {type}",
    selectionDesc: "Prioridad clasificada para asignaciones de colaboración",
    generatedText: "Generado: {time}",
    generateBtn: "Generar cola de selección",
    generatingBtn: "Generando despacho autorizado...",
    dispatchCommitted: "Despacho Confirmado",
    systemStatus: "Estado del Sistema: CALIBRADO // BASE DE DATOS: ACTIVA",
    adminMode: "Modo Administrador Activado",
    onboardTitle: "Registro de Personal",
    onboardDesc: "Incoar y gestionar el personal y sus grupos de rotación.",
    registryDatabase: "Base de Datos de Registros",
    all: "Todos",
    onboardHeader: "Registrar Personal",
    personnelRoster: "Nómina de Personal",
    commaSeparated: "Separado por comas o saltos de línea",
    groupLabel: "Grupo de Guardia Asignado",
    edLabel: "Dpto. de Urgencias",
    edDesc: "Siempre inelegible para la selección",
    registerBtn: "Registrar Personal",
    processingBtn: "Procesando Nómina...",
    maxThreshold: "Límite Máximo",
    emergencyDept: "Dpto. Urgencias",
    overridden: "OMITIDAS",
    limitMarker: "Límite: {limit}",
    settingMaxcollabsLabel: "Límite de Colaboración Máxima",
    settingMaxcollabsDesc: "El número máximo de veces que se permite participar en colaboraciones a cualquier miembro del personal antes de ser bloqueado.",
    settingSaveSuccess: "Ajustes del sistema actualizados con éxito.",
    settingSaveBtn: "Guardar Ajustes",
    settingSavingBtn: "Guardando Ajustes...",
    setEd: "Asignar Urgencias",
    edActive: "Urgencias Activo",
    overrideLimit: "Omitir Límite",
    overrideOn: "Omitido",
    deletePersonnel: "Eliminar personal",
    confirm: "Confirmar",
    cancel: "Cancelar",
    systemAdmin: "Administración del Sistema",
    adminDesc: "Gestionar privilegios elevados y configuraciones del sistema.",
    authorizeTitle: "Autorizar Nuevo Administrador",
    userUid: "UID de Usuario",
    uidHint: "El usuario puede encontrar su UID en su sección de perfil.",
    officialEmail: "Correo Oficial",
    authorizeBtn: "Autorizar Administrador",
    authorizingBtn: "Autorizando...",
    advisoryTitle: "Aviso de Pre-despliegue",
    advisoryDesc: "Los administradores autorizados tienen acceso completo de escritura y eliminación de todo el registro. Asegúrese de verificar los UIDs antes de otorgar el estado de administrador.",
    operationalStatus: "Estado Operativo",
    dbEngine: "Motor de Base de Datos",
    secure: "SEGURO",
    encryption: "Capa de Criptografía",
    aes256: "AES-256",
    dispatchHistory: "Historial de Despachos",
    historyDesc: "Revisar los registros operativos y certificar colaboraciones reales para el seguimiento de registros.",
    deploymentLogs: "Registros de Despacho",
    personnelCount: "Personas seleccionadas: {count}",
    certified: "Certificado",
    pending: "Pendiente",
    auditLog: "Registro de Auditoría",
    statusCode: "Estado de Certificación",
    certifyInstruction: "Certificar miembros que participaron efectivamente en la colaboración para el cálculo de límites:",
    unknownId: "Identificación Desconocida",
    certifyBtn: "CERTIFICAR DESPACHO",
    logFinalized: "Registro Operativo Finalizado",
    logFinalizedDesc: "Las métricas de actividad se han cargado con éxito en los registros del personal.",
    adminAuthRequired: "Se Requiere Autorización de Administrador",
    contactAdminDesc: "Póngase en contacto con un administrador del sistema para certificar este registro operativo.",
    selectLogPrompt: "Seleccione un despacho del historial para revisar sus detalles y certificar la colaboración realizada.",
    dashboard: "Panel de Control",
    history: "Historial",
    adminSettings: "Ajustes Administrador",
    signOut: "Cerrar Sesión",
    adminLoginTitle: "Inicio de Sesión Centralizado",
    adminLoginDesc: "El inicio de sesión centralizado coordina las funciones administrativas de forma segura.",
    emailLabel: "Dirección de Correo Oficial",
    passwordLabel: "Contraseña",
    loginBtn: "Autenticar de Forma Segura",
    signUpLink: "¿No tienes una cuenta de administrador? Regístrate aquí",
    loginLink: "¿Ya tienes cuenta? Inicia sesión aquí",
    signUpBtn: "Registrar ID de Administrador",
    alertTitle: "Garantía de Ejecución Sin IA",
    alertDesc: "Este despachador opera en su totalidad mediante algoritmos de ordenamiento deterministas (shuffle) según los índices cíclicos de la Guardia. No se utilizan modelos de IA ni integraciones estocásticas durante la generación de colas.",
    deleteLogBtn: "Eliminar Registro",
    confirmDeleteLog: "¿Está seguro de que desea eliminar permanentemente este registro de despacho?",
    deleteFailed: "Error al eliminar",
    successAdminCreated: "Registro de administrador creado con éxito.",
    failedAdminCreated: "No se pudo agregar al administrador. Compruebe los permisos o credenciales.",
    noLogsGenerated: "No se han generado registros.",
    languageSelector: "Idioma / Language"
  }
};
