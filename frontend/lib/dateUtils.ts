// Simple date formatting utilities to replace date-fns

export const format = (date: Date | string | null | undefined, formatStr: string): string => {
  if (!date) {
    return '';
  }
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const pad = (num: number) => String(num).padStart(2, '0');
  const padDay = (num: number) => String(num).padStart(2, ' '); // Space-pad for day
  
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const daySpace = padDay(d.getDate()); // Space-padded day
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthAbbr = monthNames[d.getMonth()];
  
  // Support common format strings
  if (formatStr === 'PPP') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (formatStr === 'PPpp') {
    return d.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  if (formatStr === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }
  if (formatStr === 'MM/dd/yyyy') {
    return `${month}/${day}/${year}`;
  }
  if (formatStr === 'MMM dd, yyyy') {
    return `${monthAbbr} ${day}, ${year}`;
  }
  if (formatStr === 'MMM d, yyyy') {
    return `${monthAbbr} ${daySpace.trim()}, ${year}`;
  }
  if (formatStr === 'MMM d, HH:mm:ss') {
    return `${monthAbbr} ${daySpace.trim()}, ${hours}:${minutes}:${seconds}`;
  }
  if (formatStr === 'MMM d, yyyy HH:mm') {
    return `${monthAbbr} ${daySpace.trim()}, ${year} ${hours}:${minutes}`;
  }
  if (formatStr === 'HH:mm:ss') {
    return `${hours}:${minutes}:${seconds}`;
  }
  
  // Default format
  return d.toLocaleString();
};

export const formatDistanceToNow = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
};
