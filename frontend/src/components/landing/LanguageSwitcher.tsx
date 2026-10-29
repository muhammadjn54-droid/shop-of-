import { FormControl, Select, MenuItem, Box } from '@mui/material';
import { Globe2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { type Language } from '../../i18n/translations';
import { FlagIcon } from '../common/FlagIcon';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'tg', label: 'Тоҷикӣ' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher = ({ className = '' }: LanguageSwitcherProps) => {
  const { lang, setLang, t } = useLanguage();

  const handleChange = (event: any) => {
    setLang(event.target.value as Language);
  };

  return (
    <Box
      className={`relative flex items-center gap-1.5 rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] px-2.5 py-0.5 text-[var(--lp-ink-soft)] shadow-[var(--lp-shadow-sm)] transition-all hover:shadow-[var(--lp-shadow-md)] hover:border-[var(--lp-emerald-bright)] ${className}`}
      sx={{
        '& .MuiInputBase-root': {
          fontSize: '12px',
          fontFamily: 'inherit',
          height: '30px',
        },
        '& .MuiSelect-select': {
          paddingTop: '4px',
          paddingBottom: '4px',
          paddingLeft: '4px',
          paddingRight: '28px !important',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '& .MuiSvgIcon-root': {
          right: '10px',
          width: '14px',
          height: '14px',
          color: 'var(--lp-muted)',
        },
      }}
    >
      <Globe2 className="hidden w-3.5 h-3.5 text-[var(--lp-muted)] sm:block" aria-hidden="true" />
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <Select
          value={lang}
          onChange={handleChange}
          aria-label={t('lpLanguageLabel')}
          renderValue={(selected) => {
            const selectedLang = LANGUAGES.find((l) => l.code === selected);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FlagIcon code={selected as Language} className="w-4 h-2.5" />
                <span className="text-[12px] font-medium">{selectedLang?.label}</span>
              </Box>
            );
          }}
        >
          {LANGUAGES.map((item) => (
            <MenuItem key={item.code} value={item.code} sx={{ fontSize: '12px', gap: '8px', display: 'flex', alignItems: 'center' }}>
              <FlagIcon code={item.code} className="w-4 h-2.5" />
              <span>{item.label}</span>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSwitcher;
