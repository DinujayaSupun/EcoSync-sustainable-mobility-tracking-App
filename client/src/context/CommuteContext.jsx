import { createContext, useState, useContext, useCallback } from 'react';

export const CommuteContext = createContext();

// Custom hook to use CommuteContext
export const useCommute = () => {
    const context = useContext(CommuteContext);
    if (!context) {
        throw new Error('useCommute must be used within CommuteProvider');
    }
    return context;
};

export const CommuteProvider = ({ children }) => {
    // Timestamp to trigger refreshes across components
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Track the last logged commute for UI feedback
    const [lastLoggedCommute, setLastLoggedCommute] = useState(null);

    // Function to trigger data refresh across all listening components
    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    // Function to call when a commute is successfully logged
    const onCommuteLogged = useCallback((commuteData) => {
        setLastLoggedCommute({
            ...commuteData,
            timestamp: Date.now(),
        });
        // Trigger all components to refresh their data
        triggerRefresh();
    }, [triggerRefresh]);

    return (
        <CommuteContext.Provider
            value={{
                refreshTrigger,
                triggerRefresh,
                lastLoggedCommute,
                onCommuteLogged,
            }}
        >
            {children}
        </CommuteContext.Provider>
    );
};
