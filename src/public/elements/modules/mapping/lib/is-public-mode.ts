import { APP_MODULES } from '../../../../../types';


export const isPublicMode = () => location.pathname === APP_MODULES.PUBLIC;
