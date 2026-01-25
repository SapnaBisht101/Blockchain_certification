import { createContext, useContext, useState, useCallback } from "react";
import GlobalMessageModal from "./GlobalMessageModel";

const MessageContext = createContext();

export function GlobalMessageProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState("success");
  const [message, setMessage] = useState("");

  const showMessage = useCallback((msg, msgType = "success") => {
    setMessage(msg);
    setType(msgType);
    setVisible(true);
  }, []);

  const hideMessage = useCallback(() => {
    setVisible(false);
  }, []);


  return (
    <MessageContext.Provider value={{ showMessage, hideMessage }}>
      {children}

      <GlobalMessageModal
        visible={visible}
        type={type}
        message={message}
        onClose={hideMessage}
      />
    </MessageContext.Provider>
  );
}

export function useMessage() {
  return useContext(MessageContext);
}
