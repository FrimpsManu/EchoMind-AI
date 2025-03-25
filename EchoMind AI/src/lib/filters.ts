import { Message, FilterOptions } from './types';
import { isWithinInterval, parseISO } from 'date-fns';

export function filterMessages(messages: Message[], options: FilterOptions, searchQuery: string): Message[] {
  return messages.filter(message => {
    // Search text filter
    if (searchQuery && !message.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (options.category && message.category !== options.category) {
      return false;
    }

    // Pinned messages filter
    if (options.onlyPinned && !message.reactions?.pinned) {
      return false;
    }

    // Date range filter
    if (options.dateRange) {
      const messageDate = new Date(message.timestamp);
      if (!isWithinInterval(messageDate, {
        start: options.dateRange.start,
        end: options.dateRange.end
      })) {
        return false;
      }
    }

    return true;
  });
}