import { describe, expect, it } from 'vitest';
import { G2_REGIONS, fitG2Text, nativeDisplay } from './g2-display';
import { G2_MENU } from '@/components/demo/gestures';
import { validateEvenHubPageContainer } from '@evenrealities/even_hub_sdk';
describe('native display payload', () => {
  it('passes official SDK validation with all three regions and the native menu', () => {
    const payload = nativeDisplay({ clock: '14:00', title: 'TODAY', body: 'Drink water', footer: 'Tap = done' });
    const page = {
      textObject: (Object.keys(G2_REGIONS) as Array<keyof typeof G2_REGIONS>).map(key => ({ ...G2_REGIONS[key], textColor: 4, content: payload[key] })),
      menuObject: { menuItems: G2_MENU },
    };
    expect(validateEvenHubPageContainer(page)).toEqual({ valid: true });
  });
  it('bounds every line and clips long family input', () => {
    const result = fitG2Text('a'.repeat(200), 22, 4);
    expect(result.split('\n')).toHaveLength(4);
    expect(result.endsWith('…')).toBe(true);
    expect(result.split('\n').every(line => line.length <= 22)).toBe(true);
  });
  it('never loses the action footer when body is truncated', () => {
    const payload = nativeDisplay({ clock: '14:00', title: 'TODAY', body: 'Water '.repeat(200), footer: 'Tap = done' });
    expect(payload.clock).toBe('14:00');
    expect(payload.footer).toBe('Tap = done');
    expect(payload.body.split('\n')).toHaveLength(5);
  });
  it('keeps all native regions inside the 576 by 288 device display', () => {
    for (const region of Object.values(G2_REGIONS)) {
      expect(region.xPosition + region.width).toBeLessThanOrEqual(576);
      expect(region.yPosition + region.height).toBeLessThanOrEqual(288);
    }
    expect(G2_REGIONS.clock.yPosition).toBe(G2_REGIONS.body.yPosition);
    expect(G2_REGIONS.footer.yPosition).toBeGreaterThan(G2_REGIONS.body.yPosition + G2_REGIONS.body.height);
  });
});