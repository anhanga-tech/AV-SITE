import { LandingPillars } from '../shared/LandingPillars';
import { PILLARS } from './constants';

const HEADING = <>Por que empresas <br /><span className="text-brand-cyan">escolhem a Anhangá.</span></>;

export function CorpPillars() {
    return <LandingPillars heading={HEADING} pillars={PILLARS} eyebrow={null} />;
}
