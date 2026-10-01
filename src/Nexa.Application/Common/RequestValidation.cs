using System.ComponentModel.DataAnnotations;

namespace Nexa.Application.Common;

public static class RequestValidation
{
    public static Error? Validate(object request)
    {
        var results = new List<ValidationResult>();
        return Validator.TryValidateObject(request, new ValidationContext(request), results, true)
            ? null
            : new Error(ErrorType.Validation, "invalid_request", string.Join(" ", results.Select(result => result.ErrorMessage)));
    }
}
