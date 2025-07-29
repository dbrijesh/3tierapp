namespace TodoApi.Configuration;

public class AuthSettings
{
    public CognitoSettings Cognito { get; set; } = new();
    public AzureADSettings AzureAD { get; set; } = new();
}

public class CognitoSettings
{
    public string Region { get; set; } = string.Empty;
    public string UserPoolId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
}

public class AzureADSettings
{
    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
}