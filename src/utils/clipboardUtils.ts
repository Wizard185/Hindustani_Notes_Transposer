// utils/clipboardUtils.ts
export const copyToClipboard = async (text: string, toast: any) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (!successful) throw new Error('Fallback copy failed');
    }
    toast({ title: 'Copied!', description: 'Text copied to clipboard.' });
  } catch (e) {
    console.error('Copy failed:', e);
    toast({
      title: 'Failed to copy',
      description: 'Clipboard access was denied.',
      variant: 'destructive',
    });
  }
};
