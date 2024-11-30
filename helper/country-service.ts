export const getCountryName = (locale: string, countryCode: string): string | undefined => {
    // TODO: Workaround, should be fixed with help of FE
    if (countryCode === "HK") {
        return "Hong Kong"
    } else if (countryCode === "MO") {
        return "Macao"
    }

    const regionNames = new Intl.DisplayNames(
        [locale],
        {type: 'region', style: 'long'}
    );

    return regionNames.of(countryCode);
};

export const getLanguageName = (locale: string, langCode: string): string => {
    const languageNames = new Intl.DisplayNames([locale], {type: 'language'});
    return languageNames.of(langCode) ?? '';
};