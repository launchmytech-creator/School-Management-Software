import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const gradeRank = (name: string): number => {
  const lower = name.toLowerCase().trim();

  const exact: Record<string, number> = {
    'pre-nursery': 0.5,
    'pre nursery': 0.5,
    'playgroup': 0.6,
    'play group': 0.6,
    'nursery': 1,
    'lkg': 2,
    'ukg': 3,
  };

  if (exact[lower] !== undefined) return exact[lower];

  const matchNum = lower.match(/^(?:class|grade|standard|std|cl)\s*[-\s]*(?:(\d+))$/i);
  if (matchNum) return 10 + parseInt(matchNum[1], 10);

  const romanMap: Record<string, number> = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6,
    vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12,
  };
  const matchRoman = lower.match(/^(?:class|grade|standard|std|cl)\s*[-\s]*([ivxlcdm]+)$/i);
  if (matchRoman) {
    const r = romanMap[matchRoman[1].toLowerCase()];
    if (r) return 10 + r;
  }

  const matchStandalone = lower.match(/^(\d+)$/);
  if (matchStandalone) return 10 + parseInt(matchStandalone[1], 10);

  return 999;
};

export const sortByGrade = <T extends { name: string; section?: string | null }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const rankA = gradeRank(a.name);
    const rankB = gradeRank(b.name);
    if (rankA !== rankB) return rankA - rankB;
    return (a.section || '').localeCompare(b.section || '');
  });
};

export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};

export const getAcademicYearOptions = (count: number = 5): string[] => {
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  
  for (let i = -1; i < count; i++) {
    const startYear = currentYear + i;
    options.push(`${startYear}-${startYear + 1}`);
  }
  
  return options;
};

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', options || defaultOptions);
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(date);
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '??';
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const getErrorMessage = (error: unknown, fallback: string = 'An error occurred'): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
};

export const getLocalDateString = (date?: Date): string => {
  const d = date || new Date();
  return d.toLocaleDateString('en-CA');
};

export const getFeeTermsLabel = (feeTerms: number): string => {
  switch (feeTerms) {
    case 1:
      return "Yearly";
    case 2:
      return "Half-yearly";
    case 4:
      return "Quarterly";
    case 12:
      return "Monthly";
    default:
      return `${feeTerms} terms`;
  }
};
