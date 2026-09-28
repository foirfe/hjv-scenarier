import {
    useEffect,
    useState,
} from "react";

import {
    getApiStatus,
    setApiStatus,
    subscribeApiStatus,
    type ApiStatus,
} from "../api/apiStatus";

export function useApiStatus() {
    const [
        status,
        setStatus,
    ] = useState<ApiStatus>(
        () => getApiStatus(),
    );

    useEffect(() => {
        const unsubscribe =
            subscribeApiStatus(
                setStatus,
            );

        function handleOffline() {
            setApiStatus(
                "offline",
            );
        }

        function handleOnline() {
            // Internetforbindelsen er tilbage, men vi ved endnu ikke om API'et svarer.
            setApiStatus("unknown");
        }

        window.addEventListener(
            "offline",
            handleOffline,
        );

        window.addEventListener(
            "online",
            handleOnline,
        );

        return () => {
            unsubscribe();

            window.removeEventListener(
                "offline",
                handleOffline,
            );

            window.removeEventListener(
                "online",
                handleOnline,
            );
        };
    }, []);

    return status;
}