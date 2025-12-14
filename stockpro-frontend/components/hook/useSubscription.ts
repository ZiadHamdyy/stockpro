import { useMemo, useEffect, useRef } from 'react';
import {
  useGetCurrentSubscriptionQuery,
  useGetPlanLimitsQuery,
  useGetUsageStatsQuery,
} from '../store/slices/subscriptionApiSlice';
import type { LimitCheckResult, PlanLimits } from '../../types';
import { getHostOverride } from '../store/ApiSlice';

export const useSubscription = () => {
  const hostRef = useRef<string | null>(getHostOverride());
  
  const { 
    data: subscription, 
    isLoading: subscriptionLoading, 
    error: subscriptionError,
    refetch: refetchSubscription 
  } = useGetCurrentSubscriptionQuery(undefined, {
    // Refetch on mount or when args change
    refetchOnMountOrArgChange: true,
  });
  
  const { 
    data: limits, 
    isLoading: limitsLoading, 
    error: limitsError,
    refetch: refetchLimits 
  } = useGetPlanLimitsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  
  const { 
    data: usage, 
    isLoading: usageLoading, 
    error: usageError,
    refetch: refetchUsage 
  } = useGetUsageStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Refetch subscription data when host changes
  useEffect(() => {
    const currentHost = getHostOverride();
    
    // If host changed, refetch all subscription data
    if (hostRef.current !== currentHost) {
      hostRef.current = currentHost;
      refetchSubscription();
      refetchLimits();
      refetchUsage();
    }

    // Listen for custom company switch event
    const handleCompanySwitch = () => {
      const newHost = getHostOverride();
      if (hostRef.current !== newHost) {
        hostRef.current = newHost;
        refetchSubscription();
        refetchLimits();
        refetchUsage();
      }
    };

    // Listen for localStorage changes (cross-tab company switches)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'X-Override-Host') {
        handleCompanySwitch();
      }
    };

    // Listen for custom event that can be dispatched when switching companies
    window.addEventListener('company-switch', handleCompanySwitch);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('company-switch', handleCompanySwitch);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refetchSubscription, refetchLimits, refetchUsage]);

  const isLoading = subscriptionLoading || limitsLoading || usageLoading;
  const error = subscriptionError || limitsError || usageError;

  // Debug logging for subscription state
  useEffect(() => {
    console.log('[useSubscription] Subscription state:', {
      subscription,
      planType: subscription?.planType,
      isLoading: subscriptionLoading,
      error: subscriptionError,
      rawData: subscription,
    });
  }, [subscription, subscriptionLoading, subscriptionError]);

  // Error handling for missing subscription
  useEffect(() => {
    if (subscriptionError) {
      console.error('[useSubscription] Error fetching subscription:', subscriptionError);
    }
    if (!subscriptionLoading && !subscription) {
      console.warn('[useSubscription] No subscription found for company');
    }
  }, [subscription, subscriptionLoading, subscriptionError]);

  /**
   * Check if a resource limit has been reached or is close
   */
  const checkLimit = useMemo(() => {
    return (resource: keyof PlanLimits): LimitCheckResult | null => {
      if (!limits || !usage) return null;

      const limit = limits[resource];
      const current = usage[resource as keyof typeof usage] || 0;

      // Handle boolean limits (like financialAnalysisEnabled)
      if (typeof limit === 'boolean') {
        return {
          allowed: limit,
          current: limit ? 1 : 0,
          limit: 1,
          percentage: limit ? 100 : 0,
          resourceName: resource,
        };
      }

      // Handle numeric limits
      const numericLimit = limit as number;
      
      // -1 means unlimited
      if (numericLimit === -1) {
        return {
          allowed: true,
          current,
          limit: -1,
          percentage: 0,
          resourceName: resource,
        };
      }

      const percentage = numericLimit > 0 ? (current / numericLimit) * 100 : 0;
      const allowed = current < numericLimit;

      return {
        allowed,
        current,
        limit: numericLimit,
        percentage,
        resourceName: resource,
      };
    };
  }, [limits, usage]);

  /**
   * Check if a resource limit has been reached
   */
  const isLimitReached = useMemo(() => {
    return (resource: keyof PlanLimits): boolean => {
      const result = checkLimit(resource);
      return result ? !result.allowed : false;
    };
  }, [checkLimit]);

  /**
   * Check if approaching limit (>= 80%)
   */
  const isApproachingLimit = useMemo(() => {
    return (resource: keyof PlanLimits): boolean => {
      const result = checkLimit(resource);
      return result ? result.percentage >= 80 && result.percentage < 100 : false;
    };
  }, [checkLimit]);

  /**
   * Get percentage used for a resource
   */
  const getUsagePercentage = useMemo(() => {
    return (resource: keyof PlanLimits): number => {
      const result = checkLimit(resource);
      return result ? result.percentage : 0;
    };
  }, [checkLimit]);

  /**
   * Get color indicator for usage level
   */
  const getUsageColor = useMemo(() => {
    return (resource: keyof PlanLimits): string => {
      const percentage = getUsagePercentage(resource);
      if (percentage >= 100) return 'red';
      if (percentage >= 80) return 'yellow';
      return 'green';
    };
  }, [getUsagePercentage]);

  return {
    subscription,
    limits,
    usage,
    isLoading,
    error,
    checkLimit,
    isLimitReached,
    isApproachingLimit,
    getUsagePercentage,
    getUsageColor,
  };
};

