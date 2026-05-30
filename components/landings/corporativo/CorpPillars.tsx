import { LandingPillars } from '../shared/LandingPillars';
import { PILLARS } from './constants';

export function CorpPillars() {
    return (
        <LandingPillars
            heading={<>Por que empresas <br /><span className="text-brand-cyan">escolhem a Anhangá.</span></>}
            pillars={PILLARS}
        />
    );
}
