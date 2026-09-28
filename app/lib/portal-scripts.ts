/** Public fields returned to active-plan portal clients. */
export type PortalAdminScriptDto = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  language: "powershell";
  script: string;
};
