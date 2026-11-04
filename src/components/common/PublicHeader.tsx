import { Link } from 'react-router-dom'
import logo from '../../assets/images/city-engineering-logo.png'
import Icon from '../ui/Icon'
import { usePortal } from '../../app/PortalContext'

export default function PublicHeader() {
  const { openInbox } = usePortal()
  return <><header className="public-header"><Link to="/public" className="public-brand"><img src={logo} alt="City Engineering Office"/><div><b>Legazpi City</b><span>Public Infrastructure Project Monitoring</span></div></Link><nav aria-label="Public navigation"><Link to="/public">Explore projects</Link><button className="button button-secondary" onClick={openInbox}><Icon name="mail" size={16}/><span>Demo inbox</span></button><Link className="button button-primary" to="/admin/approvals">Admin workspace <Icon name="arrow" size={16}/></Link></nav></header><div className="public-demo-notice">Frontend demonstration · All projects and approval records are sample data.</div></>
}
