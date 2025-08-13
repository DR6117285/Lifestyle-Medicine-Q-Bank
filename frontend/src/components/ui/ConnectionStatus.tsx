import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Cloud,
  CloudOff,
  Signal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOnlineStatus, useConnectionInfo, useOfflineQueue } from '@/hooks/useOfflineSupport';
import { useToastHelpers } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className, 
  showDetails = false 
}) => {
  const isOnline = useOnlineStatus();
  const connectionInfo = useConnectionInfo();
  const { queue, queueLength, processQueue } = useOfflineQueue();
  const { success, warning, info } = useToastHelpers();
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  // Track online/offline transitions
  useEffect(() => {
    if (isOnline) {
      setLastOnlineTime(new Date());
      if (queueLength > 0) {
        info('Connection restored', `Processing ${queueLength} queued actions`);
        processQueue();
      }
    } else {
      warning('Connection lost', 'Working offline - changes will be synced when reconnected');
    }
  }, [isOnline, queueLength, processQueue, info, warning]);

  // Connection quality indicator
  const getConnectionQuality = () => {
    if (!isOnline) return 'offline';
    if (connectionInfo.effectiveType === '4g' || connectionInfo.downlink > 10) return 'excellent';
    if (connectionInfo.effectiveType === '3g' || connectionInfo.downlink > 1.5) return 'good';
    if (connectionInfo.effectiveType === '2g' || connectionInfo.downlink > 0.5) return 'poor';
    return 'very-poor';
  };

  const connectionQuality = getConnectionQuality();

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    
    switch (connectionQuality) {
      case 'excellent': return <Wifi className="h-4 w-4" />;
      case 'good': return <Signal className="h-4 w-4" />;
      case 'poor': return <Signal className="h-4 w-4 opacity-60" />;
      case 'very-poor': return <Signal className="h-4 w-4 opacity-30" />;
      default: return <Wifi className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-error-100 text-error-700 border-error-300';
    
    switch (connectionQuality) {
      case 'excellent': return 'bg-success-100 text-success-700 border-success-300';
      case 'good': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'poor': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'very-poor': return 'bg-error-100 text-error-700 border-error-300';
      default: return 'bg-muted text-slate-600 dark:text-slate-300 font-medium border-muted';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (connectionQuality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Poor';
      case 'very-poor': return 'Very Poor';
      default: return 'Connected';
    }
  };

  const formatLastOnline = () => {
    if (!lastOnlineTime || isOnline) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - lastOnlineTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${diffHours}h ago`;
  };

  if (!showDetails) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-2 transition-colors duration-200",
          getStatusColor(),
          className
        )}
      >
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
        {queueLength > 0 && (
          <span className="bg-current/20 text-xs px-1 rounded">
            {queueLength}
          </span>
        )}
      </Badge>
    );
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Main Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isOnline ? "bg-success-100 text-success-600" : "bg-error-100 text-error-600"
              )}>
                {isOnline ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-medium">
                  {isOnline ? 'Connected' : 'Offline'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {isOnline ? 'All features available' : 'Working offline'}
                </p>
              </div>
            </div>
            
            <Badge 
              variant="outline" 
              className={cn("flex items-center gap-2", getStatusColor())}
            >
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
          </div>

          {/* Connection Details */}
          {isOnline && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Speed:</span>
                <div className="font-medium">
                  {connectionInfo.downlink > 0 
                    ? `${connectionInfo.downlink} Mbps`
                    : connectionInfo.effectiveType.toUpperCase()
                  }
                </div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Latency:</span>
                <div className="font-medium">
                  {connectionInfo.rtt > 0 ? `${connectionInfo.rtt}ms` : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Offline Queue */}
          {queueLength > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  <span className="text-sm font-medium">
                    {queueLength} action{queueLength !== 1 ? 's' : ''} queued
                  </span>
                </div>
                {isOnline && (
                  <Button size="sm" variant="ghost" onClick={processQueue}>
                    Sync Now
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                {isOnline 
                  ? 'Syncing with server...' 
                  : 'Will sync when connection is restored'
                }
              </p>
            </div>
          )}

          {/* Last Online Time */}
          {!isOnline && lastOnlineTime && (
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Last online: {formatLastOnline()}
            </div>
          )}

          {/* Data Saver Mode */}
          {connectionInfo.saveData && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Data saver mode enabled</span>
            </div>
          )}

          {/* Connection Tips */}
          {connectionQuality === 'poor' || connectionQuality === 'very-poor' ? (
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium p-2 bg-muted/50 rounded">
              💡 Tip: Poor connection detected. Some features may load slowly.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

// Compact connection indicator for header/toolbar
export const ConnectionIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const isOnline = useOnlineStatus();
  const { queueLength } = useOfflineQueue();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full transition-colors duration-200",
        isOnline ? "bg-success-600" : "bg-error-600"
      )} />
      {queueLength > 0 && (
        <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
          {queueLength}
        </Badge>
      )}
    </div>
  );
};

// Network status banner for critical offline situations
interface OfflineBannerProps {
  show: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
  show, 
  onDismiss, 
  className 
}) => {
  if (!show) return null;

  return (
    <div className={cn(
      "w-full bg-orange-100 border-orange-300 border-b px-4 py-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-orange-700" />
          <div>
            <p className="font-medium text-orange-900">
              You're currently offline
            </p>
            <p className="text-sm text-orange-700">
              Your progress is being saved locally and will sync when reconnected.
            </p>
          </div>
        </div>
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="text-orange-700 hover:text-orange-900"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};