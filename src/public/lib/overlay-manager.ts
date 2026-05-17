import { ByPass } from '../../types';

const overlayManagerRegister: Record<string, { open: (data: ByPass) => Promise<unknown> | void; close: () => void}> = {};
export const overlayManager = {
  register: (
    id: string,
    actions: {
      open: (data: ByPass) => Promise<unknown> | void;
      close: () => void;
    }
  ) => {
    overlayManagerRegister[id] = actions;
  },
  open: (id: string, data?: ByPass) => {
    Object.values(overlayManagerRegister).forEach(actions => {
      actions.close();
    });

    return overlayManagerRegister[id].open(data);
  }
};
