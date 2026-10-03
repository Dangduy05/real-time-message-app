import {
    useEffect
} from 'react';

const useInfiniteScroll =
    (
        ref,
        callback
    ) => {

        useEffect(() => {

            const handleScroll =
                () => {

                    if (
                        ref.current.scrollTop
                        === 0
                    ) {

                        callback();

                    }

                };

            ref.current?.addEventListener(
                'scroll',
                handleScroll
            );

            return () => {

                ref.current?.removeEventListener(
                    'scroll',
                    handleScroll
                );

            };

        }, []);

    };

export default useInfiniteScroll;