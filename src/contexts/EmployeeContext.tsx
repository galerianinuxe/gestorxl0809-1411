import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmployeeContextType {
  isEmployee: boolean;
  isOwner: boolean;
  ownerUserId: string | null;
  employeeId: string | null;
  employeeRole: string | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isEmployee, setIsEmployee] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeRole, setEmployeeRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const checkUserRole = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setIsEmployee(false);
      setIsOwner(true);
      setOwnerUserId(null);
      setEmployeeId(null);
      setEmployeeRole(null);
      setPermissions([]);
      return;
    }

    try {
      // Check if user is an employee of any depot
      const { data: employeeData, error: employeeError } = await supabase
        .from('depot_employees')
        .select('id, owner_user_id, role, is_active')
        .eq('employee_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (employeeError) {
        console.error('Error checking employee status:', employeeError);
        // Default to owner if error
        setIsEmployee(false);
        setIsOwner(true);
        setOwnerUserId(user.id);
        setLoading(false);
        return;
      }

      if (employeeData) {
        // User is an employee
        setIsEmployee(true);
        setIsOwner(false);
        setOwnerUserId(employeeData.owner_user_id);
        setEmployeeId(employeeData.id);
        setEmployeeRole(employeeData.role);

        // Fetch employee permissions
        const { data: permData, error: permError } = await supabase
          .from('employee_permissions')
          .select('permission')
          .eq('employee_id', employeeData.id);

        if (permError) {
          console.error('Error fetching permissions:', permError);
        } else {
          setPermissions(permData?.map(p => p.permission) || []);
        }

        // Update last login
        await supabase
          .from('depot_employees')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', employeeData.id);
      } else {
        // User is a depot owner
        setIsEmployee(false);
        setIsOwner(true);
        setOwnerUserId(user.id);
        setEmployeeId(null);
        setEmployeeRole(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      // Default to owner if error
      setIsEmployee(false);
      setIsOwner(true);
      setOwnerUserId(user?.id || null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  const hasPermission = useCallback((permission: string): boolean => {
    // Owners have all permissions
    if (isOwner) return true;
    return permissions.includes(permission);
  }, [isOwner, permissions]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    // Owners have all permissions
    if (isOwner) return true;
    return perms.some(p => permissions.includes(p));
  }, [isOwner, permissions]);

  const refreshPermissions = useCallback(async () => {
    await checkUserRole();
  }, [checkUserRole]);

  const value: EmployeeContextType = {
    isEmployee,
    isOwner,
    ownerUserId,
    employeeId,
    employeeRole,
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    refreshPermissions,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee(): EmployeeContextType {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
}
