import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

interface OrgContextType {
  orgId: string | null
  orgName: string | null
  loading: boolean
}

const OrgContext = createContext<OrgContextType>({ orgId: null, orgName: null, loading: true })

export function useOrg() {
  return useContext(OrgContext)
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const profile = await api.getProfile()
        if (profile.organizations.length > 0) {
          setOrgId(profile.organizations[0].org_id)
          setOrgName(profile.organizations[0].org_name)
        } else {
          // Auto-create org for new users
          const org = await api.createOrg('Mi Empresa')
          setOrgId(org.id)
          setOrgName(org.name)
        }
      } catch (e) {
        console.error('Failed to load org', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  return (
    <OrgContext.Provider value={{ orgId, orgName, loading }}>
      {children}
    </OrgContext.Provider>
  )
}
