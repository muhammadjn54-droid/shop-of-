import { useEffect, useRef, useState, type ChangeEvent } from 'react';

export function useImageSelection(onError: (message: string) => void) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const urls = useRef<string[]>([]);
  useEffect(() => () => { urls.current.forEach(URL.revokeObjectURL); }, []);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const additions = Array.from(event.target.files || []);
    event.target.value = '';
    if (additions.some(file => !/\.(jpe?g|png|webp)$/i.test(file.name) || file.size > 5 * 1024 * 1024)) {
      onError('Выберите JPG, PNG или WebP размером не более 5 МБ каждый.');
      return;
    }
    const nextUrls = additions.map(file => URL.createObjectURL(file));
    urls.current = [...urls.current, ...nextUrls];
    setFiles(previous => [...previous, ...additions]);
    setPreviews([...urls.current]);
  };
  const remove = (index: number) => {
    URL.revokeObjectURL(urls.current[index]);
    urls.current = urls.current.filter((_, i) => i !== index);
    setFiles(previous => previous.filter((_, i) => i !== index));
    setPreviews([...urls.current]);
  };
  const clear = () => {
    urls.current.forEach(URL.revokeObjectURL);
    urls.current = [];
    setFiles([]);
    setPreviews([]);
  };
  return { files, previews, onChange, remove, clear };
}
