import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';
const diag=initDiagnostics();
Spine.start({diag});