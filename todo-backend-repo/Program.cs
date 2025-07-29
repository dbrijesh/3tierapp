using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using TodoApi.Models;
using TodoApi.Services;
using TodoApi.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<AuthSettings>(
    builder.Configuration.GetSection("AuthSettings"));

builder.Services.AddSingleton<ITodoService, InMemoryTodoService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer("Cognito", options =>
    {
        var cognitoSettings = builder.Configuration.GetSection("AuthSettings:Cognito");
        options.Authority = $"https://cognito-idp.{cognitoSettings["Region"]}.amazonaws.com/{cognitoSettings["UserPoolId"]}";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://cognito-idp.{cognitoSettings["Region"]}.amazonaws.com/{cognitoSettings["UserPoolId"]}",
            ValidateAudience = true,
            ValidAudience = cognitoSettings["ClientId"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    })
    .AddJwtBearer("AzureAD", options =>
    {
        var azureSettings = builder.Configuration.GetSection("AuthSettings:AzureAD");
        options.Authority = $"https://login.microsoftonline.com/{azureSettings["TenantId"]}/v2.0";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://login.microsoftonline.com/{azureSettings["TenantId"]}/v2.0",
            ValidateAudience = true,
            ValidAudience = azureSettings["ClientId"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AuthenticatedUser", policy =>
    {
        policy.AddAuthenticationSchemes("Cognito", "AzureAD");
        policy.RequireAuthenticatedUser();
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngularApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();