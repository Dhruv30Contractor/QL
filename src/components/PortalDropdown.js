import { createPortal } from "react-dom";

const PortalDropdown = ({ children }) => {
  return createPortal(children, document.body);
};

export default PortalDropdown;