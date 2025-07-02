export function processNames(names) {
    if (!names || names.length === 0) {
        return "N/A";
    }
    
    const primaryName = (names[0] && names[0].displayName) || "N/A";
    const accountName = (names[1] && names[1].displayName) || null;
    
    return accountName ? `${primaryName} | ${accountName}` : primaryName;
}

export function processBirthdays(birthdays) {
    if (!birthdays || birthdays.length === 0) {
        return "N/A";
    }
    
    const formatBirthday = (birthday) => {
        if (!birthday || !birthday.date) return "N/A";
        const { day = "DD", month = "MM", year = "YYYY" } = birthday.date;
        return `${day}/${month}/${year}`;
    };
    
    const primaryBirthday = formatBirthday(birthdays[0]);
    const accountBirthday = birthdays[1] ? formatBirthday(birthdays[1]) : null;
    
    return accountBirthday ? `${primaryBirthday} | ${accountBirthday}` : primaryBirthday;
}

export function processEmailAddresses(emailAddresses) {
    if (!emailAddresses || emailAddresses.length === 0) {
        return "N/A";
    }
    
    return (emailAddresses[0] && emailAddresses[0].value) || "N/A";
}

export function processPhoneNumbers(phoneNumbers) {
    if (!phoneNumbers || phoneNumbers.length === 0) {
        return "N/A";
    }
    
    const formatPhone = (phone) => {
        if (!phone) return "N/A";
        const value = phone.value || "N/A";
        const canonicalForm = phone.canonicalForm || "N/A";
        return `${value} | ${canonicalForm}`;
    };
    
    const primaryPhone = formatPhone(phoneNumbers[0]);
    const accountPhone = phoneNumbers[1] ? formatPhone(phoneNumbers[1]) : null;
    
    return accountPhone ? `${primaryPhone} | ${accountPhone}` : primaryPhone;
}