import { useEffect, useCallback } from 'react';

export function useKeyboardShortcuts(shortcuts, enabled = true) {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Ignore if focused on input, textarea, or contenteditable
    const target = event.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key === shortcut.key || event.code === shortcut.code;
      const ctrlMatches = !shortcut.ctrl || (shortcut.ctrl && (event.ctrlKey || event.metaKey));
      const shiftMatches = !shortcut.shift || (shortcut.shift && event.shiftKey);
      const altMatches = !shortcut.alt || (shortcut.alt && event.altKey);

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

// Convenience hook for spacebar toggle
export function useSpacebarToggle(handler, enabled = true) {
  useKeyboardShortcuts(
    [
      {
        key: ' ',
        code: 'Space',
        handler,
        preventDefault: true, // Prevent page scroll
      },
    ],
    enabled
  );
}
