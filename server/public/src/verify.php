<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


use Google\Auth\CredentialsLoader;
use Google\Auth\HttpHandler\HttpHandlerFactory;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

/**
 * GCECredentials supports authorization on Google Compute Engine.
 * 
 * It can be used to authorize requests using the AuthTokenMiddleware, but will 
 * only succeed if being run on GCE.
 */
class GCECredentials extends CredentialsLoader
{
    /**
     * The metadata server URL.
     */
    private const METADATA_SERVER_URL = 'http://metadata.google.internal/computeMetadata/v1/';

    /**
     * The path for the service account identity token.
     */
    private const TOKEN_URI_PATH = 'instance/service-accounts/default/token';

    /**
     * The header required for the metadata server request.
     */
    private const METADATA_FLAVOR_HEADER = ['Metadata-Flavor' => 'Google'];

    /**
     * The cache key for the token.
     */
    private const CACHE_KEY = 'GCECredentials';

    /**
     * The cache item pool.
     *
     * @var \Psr\Cache\CacheItemPoolInterface|null
     */
    private $cache;

    /**
     * The token.
     *
     * @var array<mixed>|null
     */
    private $token;

    /**
     * The expiration time of the token.
     *
     * @var int|null
     */
    private $expiry;

    /**
     * Constructs a new GCECredentials instance.
     *
     * @param array<mixed> $config Optional configuration.
     */
    public function __construct(array $config = [])
    {
        $this->cache = $config['cache'] ?? null;
    }

    /**
     * Fetches the auth tokens from the GCE metadata host.
     *
     * @param callable|null $httpHandler The HTTP handler to use.
     * @return array<mixed> The fetched token.
     *
     * @throws \Exception
     */
    public function fetchAuthToken(callable $httpHandler = null)
    {
        if ($this->token !== null && $this->expiry > time()) {
            return $this->token;
        }

        $url = self::METADATA_SERVER_URL . self::TOKEN_URI_PATH;
        $headers = self::METADATA_FLAVOR_HEADER;

        $httpHandler = $httpHandler ?: HttpHandlerFactory::build();
        try {
            $response = $httpHandler(
                new \GuzzleHttp\Psr7\Request('GET', $url, $headers)
            );
            $body = (string) $response->getBody();
            $token = json_decode($body, true);
            if (isset($token['access_token'])) {
                $this->token = $token;
                $this->expiry = time() + ($token['expires_in'] ?? 3600);
            }
            return $token;
        } catch (ConnectException | RequestException $e) {
            throw new \Exception('Unable to fetch token from GCE metadata server: ' . $e->getMessage());
        }
    }

    /**
     * Returns the cache key for the token.
     *
     * @return string The cache key.
     */
    public function getCacheKey()
    {
        return self::CACHE_KEY;
    }

    /**
     * Returns whether the credentials are expired.
     *
     * @return bool True if expired, false otherwise.
     */
    public function isExpired()
    {
        return $this->expiry === null || $this->expiry < time();
    }

    /**
     * Checks whether the current environment is running on GCE.
     *
     * @param callable|null $httpHandler The HTTP handler to use.
     * @return bool True if on GCE, false otherwise.
     */
    public static function onGce(callable $httpHandler = null)
    {
        $url = self::METADATA_SERVER_URL;
        $headers = self::METADATA_FLAVOR_HEADER;

        $httpHandler = $httpHandler ?: HttpHandlerFactory::build();
        try {
            $response = $httpHandler(
                new \GuzzleHttp\Psr7\Request('GET', $url, $headers)
            );
            return $response->getStatusCode() === 200;
        } catch (ConnectException | RequestException $e) {
            return false;
        }
    }
}