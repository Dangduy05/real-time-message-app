const SearchBar =
    ({
        value,
        onChange
    }) => {

        return (

            <input
                value={value}
                onChange={onChange}
                placeholder="Search..."
                className="
          w-full
          border
          px-4
          py-2
          rounded-lg
        "
            />

        );

    };

export default SearchBar;