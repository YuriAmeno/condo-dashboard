import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase";
import type { User, AuthError, Session } from "@supabase/supabase-js";

type UserRole = "manager" | "doorman";

interface AuthUser extends User {
  role: UserRole;
  is_active: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  checkPermissions: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Função para verificar permissões
  const checkPermissions = useCallback(
    (allowedRoles: UserRole[]): boolean => {
      if (!user) return false;
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  // Função para atualizar o último login
  const updateLastLogin = useCallback(async () => {
    try {
      const { error } = await supabase.rpc("update_user_last_login");
      if (error) {
        console.error("Error updating last login:", error);
      }
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }, []);

  // Função para processar o usuário
  const processUser = useCallback(
    async (currentSession: Session | null) => {
      if (currentSession?.user) {
        try {
          const metadata = currentSession.user.user_metadata;
          const role = metadata?.role || "doorman";
          const isActive = metadata?.is_active ?? true;

          setSession(currentSession);
          setUser({
            ...currentSession.user,
            role,
            is_active: isActive,
          });

          await updateLastLogin();

          // Avoid redirecting if the user is on the reset password page
          if (
            location.pathname.startsWith("/auth") &&
            !location.pathname.startsWith("/auth/reset-password")
          ) {
            const from = (location.state as any)?.from || "/dashboard";
            navigate(from, { replace: true });
          }
        } catch (error) {
          console.error("Error processing user:", error);
          setSession(null);
          setUser(null);
          navigate("/auth/login", {
            state: { from: location.pathname },
            replace: true,
          });
        }
      } else {
        setSession(null);
        setUser(null);

        if (!location.pathname.startsWith("/auth")) {
          navigate("/auth/login", {
            state: { from: location.pathname },
            replace: true,
          });
        }
      }
    },
    [navigate, location, updateLastLogin]
  );

  // Efeito para monitorar mudanças na sessão
  useEffect(() => {
    let mounted = true;

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        processUser(session);
        setLoading(false);
      }
    });

    // Monitorar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        processUser(session);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [processUser]);

  // Funções de autenticação
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (!data.user) {
        return {
          error: {
            name: "AuthError",
            message: "Não foi possível obter os dados do usuário.",
          } as AuthError,
        };
      }

      // Verificar se o usuário está ativo
      const isActive = data.user.user_metadata?.is_active ?? true;
      if (!isActive) {
        await supabase.auth.signOut();
        return {
          error: {
            name: "AuthError",
            message:
              "Sua conta está inativa. Entre em contato com o administrador.",
          } as AuthError,
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: {
          name: "AuthError",
          message:
            error instanceof Error ? error.message : "Erro ao fazer login",
        } as AuthError,
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return {
        error: {
          name: "AuthError",
          message:
            error instanceof Error ? error.message : "Erro ao fazer logout",
        } as AuthError,
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password?email=${email}`,
      });

      return { error };
    } catch (error) {
      return {
        error: {
          name: "AuthError",
          message:
            error instanceof Error ? error.message : "Erro ao resetar senha",
        } as AuthError,
      };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      // await adminAuthClient.auth.signInWithPassword();
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      return {
        error: {
          name: "AuthError",
          message:
            error instanceof Error ? error.message : "Erro ao atualizar senha",
        } as AuthError,
      };
    }
  };

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    checkPermissions,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
