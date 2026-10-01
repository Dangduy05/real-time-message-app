exports.getPagination =
    (page, limit) => {

        const currentPage =
            Number(page) || 1;

        const perPage =
            Number(limit) || 50;

        return {

            skip:
                (currentPage - 1)
                * perPage,

            limit:
                perPage

        };

    };