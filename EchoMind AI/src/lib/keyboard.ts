import { useHotkeys } from 'react-hotkeys-hook';

export function useKeyboardShortcuts({
  onSubmit,
  onClearInput,
  onFocusSearch,
  onNewChat
}: {
  onSubmit: () => void;
  onClearInput: () => void;
  onFocusSearch: () => void;
  onNewChat: () => void;
}) {
  useHotkeys('mod+enter', (e) => {
    e.preventDefault();
    onSubmit();
  }, { enableOnFormTags: true });

  useHotkeys('esc', (e) => {
    e.preventDefault();
    onClearInput();
  }, { enableOnFormTags: true });

  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    onFocusSearch();
  }, { enableOnFormTags: true });

  useHotkeys('mod+n', (e) => {
    e.preventDefault();
    onNewChat();
  }, { enableOnFormTags: true });
}