import Icon from '../ui/Icon'
import citySeal from '../../assets/images/city-seal.webp'
import engineeringSeal from '../../assets/images/engineering-seal.webp'

export default function PortalHeader({ onHelp, accessLabel = 'Approver access' }: { onHelp?: () => void; accessLabel?: string }) {
  return <header className="site-header">
    <div className="header-inner page-width">
      <div className="site-brand">
        <div className="brand-seals">
          <img src={citySeal} alt="Legazpi City seal" width="42" height="42" />
          <img src={engineeringSeal} alt="City Engineering Office seal" width="42" height="42" />
        </div>
        <div className="brand-copy"><strong>LEGAZPI CITY GOVERNMENT</strong><span>Public Infrastructure Project Monitoring</span></div>
      </div>
      <div className="header-actions">
        <span className="secure-label"><Icon name="shield" size={15} />{accessLabel}</span>
        {onHelp && <button className="help-button" type="button" aria-label="Help with project approval" onClick={onHelp}><Icon name="help" size={17} /><span>Need help?</span></button>}
      </div>
    </div>
  </header>
}
