import { Routes, Route, Navigate } from 'react-router-dom'
import { BaseLayout } from '@/components/layout/base-layout'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Login } from '@/pages/auth/login'
import { Register } from '@/pages/auth/register'
import { ForgotPassword } from '@/pages/auth/forgot-password'
import { ResetPassword } from '@/pages/auth/reset-password'
import { Unauthorized } from '@/pages/auth/unauthorized'
import { Inactive } from '@/pages/auth/inactive'
import { Dashboard } from '@/pages/dashboard'
import { PackageRegister } from '@/pages/packages/register'
import { PackageList } from '@/pages/packages/list'
import { PackageScan } from '@/pages/packages/scan'
import { Buildings } from '@/pages/buildings'
import { Residents } from '@/pages/residents'
import { Doormen } from '@/pages/doormen'
import { DoormanForm } from '@/pages/doormen/doorman-form'
import { DoormanStatus } from '@/pages/doormen/doorman-status'
import { NotificationTemplates } from '@/pages/notifications/templates'
import { NotificationQueue } from '@/pages/notifications/queue'
import { NotificationHistory } from '@/pages/notifications/history'
import { ResidentNotifications } from '@/pages/residents/notifications'
import { LayoutProvider } from '@/components/layout/core/LayoutContext'

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth">
        <Route index element={<Navigate to="/auth/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="unauthorized" element={<Unauthorized />} />
        <Route path="inactive" element={<Inactive />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <AuthGuard>
            <LayoutProvider>
              <BaseLayout />
            </LayoutProvider>
          </AuthGuard>
        }
      >
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Packages */}
        <Route path="/packages">
          <Route path="register" element={<PackageRegister />} />
          <Route path="list" element={<PackageList />} />
          <Route path="scan" element={<PackageScan />} />
        </Route>

        {/* Buildings */}
        <Route path="/buildings" element={<Buildings />} />

        {/* Residents */}
        <Route path="/residents" element={<Residents />} />

        {/* Manager Only Routes */}
        <Route
          path="/doormen"
          element={
            <AuthGuard allowedRoles={['manager']}>
              <Doormen />
            </AuthGuard>
          }
        />
        <Route
          path="/doormen/new"
          element={
            <AuthGuard allowedRoles={['manager']}>
              <DoormanForm />
            </AuthGuard>
          }
        />
        <Route
          path="/doormen/:id"
          element={
            <AuthGuard allowedRoles={['manager']}>
              <DoormanForm />
            </AuthGuard>
          }
        />
        <Route
          path="/doormen/:id/status"
          element={
            <AuthGuard allowedRoles={['manager']}>
              <DoormanStatus />
            </AuthGuard>
          }
        />

        {/* Notifications */}
        <Route path="/notifications">
          <Route
            path="templates"
            element={
              <AuthGuard allowedRoles={['manager']}>
                <NotificationTemplates />
              </AuthGuard>
            }
          />
          <Route path="queue" element={<NotificationQueue />} />
          <Route path="history" element={<NotificationHistory />} />
        </Route>

        {/* Resident Notifications */}
        <Route path="/residents/notifications" element={<ResidentNotifications />} />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
