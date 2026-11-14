import { describe, expect, it } from 'vitest';
import { detectPlatform, isStandalone } from '../utils/platform';

const nav = (userAgent, maxTouchPoints = 0) => ({ userAgent, maxTouchPoints });

describe('detectPlatform', () => {
  it('detects iPhone Safari', () => {
    const p = detectPlatform(nav('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'));
    expect(p).toMatchObject({ isIOS: true, isIOSSafari: true, isAndroid: false, isMobile: true });
  });
  it('treats Chrome on iOS as iOS but not Safari (cannot add to Home Screen the same way)', () => {
    const p = detectPlatform(nav('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1'));
    expect(p).toMatchObject({ isIOS: true, isIOSSafari: false });
  });
  it('detects iPadOS that reports a Mac user agent', () => {
    const p = detectPlatform(nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', 5));
    expect(p.isIOS).toBe(true);
  });
  it('does not mistake a real Mac for iPad', () => {
    const p = detectPlatform(nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', 0));
    expect(p).toMatchObject({ isIOS: false, isMobile: false });
  });
  it('detects Android', () => {
    const p = detectPlatform(nav('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'));
    expect(p).toMatchObject({ isAndroid: true, isIOS: false, isMobile: true });
  });
});

describe('isStandalone', () => {
  it('reads display-mode and the iOS navigator.standalone flag', () => {
    expect(isStandalone({ matchMedia: () => ({ matches: true }), navigator: {} })).toBe(true);
    expect(isStandalone({ matchMedia: () => ({ matches: false }), navigator: { standalone: true } })).toBe(true);
    expect(isStandalone({ matchMedia: () => ({ matches: false }), navigator: {} })).toBe(false);
  });
});
