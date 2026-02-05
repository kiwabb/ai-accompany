import * as React from 'react';
import type { EditingFragment, EditingProfileItem } from '../../components/cozypal/types';

interface UseCozyPalCallbacksOptions {
  isOpen: boolean;
  ensureGreeting: () => void;
  setEditingProfileItem: (item: EditingProfileItem | null) => void;
  setEditingFragment: (item: EditingFragment | null) => void;
  setEditValue: (value: string) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setHasUnread: (value: boolean) => void;
  sendMessage: (e?: { preventDefault: () => void }, trigger?: string, duration?: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const useCozyPalCallbacks = ({
  isOpen,
  ensureGreeting,
  setEditingProfileItem,
  setEditingFragment,
  setEditValue,
  setIsOpen,
  setHasUnread,
  sendMessage,
  inputRef,
}: UseCozyPalCallbacksOptions) => {
  const toggleChat = React.useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      ensureGreeting();
    }
  }, [ensureGreeting, isOpen, setIsOpen]);

  const handleEditProfileItem = React.useCallback((category: 'facts' | 'preferences', value: string) => {
    setEditingProfileItem({ category, value });
    setEditValue(value);
  }, [setEditValue, setEditingProfileItem]);

  const handleEditFragment = React.useCallback((id: number, content: string) => {
    setEditingFragment({ id, content });
    setEditValue(content);
  }, [setEditingFragment, setEditValue]);

  const handleOpenChange = React.useCallback(() => {
    setHasUnread(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [setHasUnread, inputRef]);

  const triggerProactiveMessage = React.useCallback((
    type: string,
    durationOverride?: number
  ) => {
    sendMessage(undefined, type, durationOverride);
  }, [sendMessage]);

  return {
    toggleChat,
    handleEditProfileItem,
    handleEditFragment,
    handleOpenChange,
    triggerProactiveMessage,
  };
};
