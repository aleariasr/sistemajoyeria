const { supabase } = require('../supabase-db');

/**
 * Model: PushSubscription
 * 
 * Manages browser push notification subscriptions for authenticated users.
 * Stores subscription details needed for Web Push API.
 */
class PushSubscription {
  /**
   * Create or update a push subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created/updated subscription
   */
  static async guardar(subscriptionData) {
    const {
      id_usuario,
      endpoint,
      p256dh,
      auth,
      user_agent
    } = subscriptionData;

    // Validate required fields
    if (!id_usuario || !endpoint || !p256dh || !auth) {
      throw new Error('Missing required subscription fields');
    }

    // Validate endpoint format
    if (!endpoint.startsWith('https://')) {
      throw new Error('Endpoint must use HTTPS');
    }

    // Check if subscription already exists for this user
    const existing = await this.obtenerPorEndpoint(endpoint);

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('push_subscriptions')
        .update({
          id_usuario,
          p256dh,
          auth,
          user_agent,
          last_used: new Date().toISOString()
        })
        .eq('endpoint', endpoint)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert([{
          id_usuario,
          endpoint,
          p256dh,
          auth,
          user_agent
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }
  }

  /**
   * Get subscription by endpoint
   * @param {string} endpoint - Subscription endpoint
   * @returns {Promise<Object|null>} Subscription data
   */
  static async obtenerPorEndpoint(endpoint) {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('endpoint', endpoint)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Get all subscriptions for a user
   * @param {number} idUsuario - User ID
   * @returns {Promise<Array>} List of subscriptions
   */
  static async obtenerPorUsuario(idUsuario) {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('id_usuario', idUsuario)
      .order('last_used', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get all active subscriptions
   * @returns {Promise<Array>} List of all subscriptions
   */
  static async obtenerTodas() {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .order('last_used', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Delete a subscription by endpoint
   * @param {string} endpoint - Subscription endpoint
   * @returns {Promise<Object>} Deletion result
   */
  static async eliminarPorEndpoint(endpoint) {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  /**
   * Delete all subscriptions for a user
   * @param {number} idUsuario - User ID
   * @returns {Promise<Object>} Deletion result
   */
  static async eliminarPorUsuario(idUsuario) {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('id_usuario', idUsuario)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  /**
   * Update last_used timestamp
   * @param {string} endpoint - Subscription endpoint
   * @returns {Promise<void>}
   */
  static async actualizarUltimoUso(endpoint) {
    await supabase
      .from('push_subscriptions')
      .update({ last_used: new Date().toISOString() })
      .eq('endpoint', endpoint);
  }

  /**
   * Clean up old/inactive subscriptions
   * @param {number} daysInactive - Days of inactivity threshold
   * @returns {Promise<number>} Number of deleted subscriptions
   */
  static async limpiarInactivas(daysInactive = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const { data, error } = await supabase
      .from('push_subscriptions')
      .delete()
      .lt('last_used', cutoffDate.toISOString())
      .select();

    if (error) {
      throw error;
    }

    return data ? data.length : 0;
  }
}

module.exports = PushSubscription;
