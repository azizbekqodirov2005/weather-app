import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLocalStorage } from '../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  it('persists values and restores them on remount', () => {
    const { result, unmount } = renderHook(() => useLocalStorage('skycast:test', { a: 1 }));
    act(() => result.current[1]({ a: 2 }));
    expect(JSON.parse(window.localStorage.getItem('skycast:test'))).toEqual({ a: 2 });
    unmount();
    const { result: again } = renderHook(() => useLocalStorage('skycast:test', { a: 1 }));
    expect(again.current[0]).toEqual({ a: 2 });
  });
  it('ignores corrupted or invalid stored values', () => {
    window.localStorage.setItem('skycast:bad', '{not json');
    const { result } = renderHook(() => useLocalStorage('skycast:bad', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    window.localStorage.setItem('skycast:theme', JSON.stringify('purple'));
    const { result: r2 } = renderHook(() => useLocalStorage('skycast:theme', 'dark', (v) => v === 'dark' || v === 'light'));
    expect(r2.current[0]).toBe('dark');
  });
});
