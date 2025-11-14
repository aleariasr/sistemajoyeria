import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { categoriesAPI, metalsAPI, stonesAPI } from '../services/api';

function Settings() {
  const [tab, setTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [metals, setMetals] = useState([]);
  const [stones, setStones] = useState([]);
  const [dialog, setDialog] = useState({
    open: false,
    type: '',
    mode: 'create',
    data: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, metalsRes, stonesRes] = await Promise.all([
        categoriesAPI.getAll(),
        metalsAPI.getAll(),
        stonesAPI.getAll(),
      ]);
      setCategories(categoriesRes.data.data);
      setMetals(metalsRes.data.data);
      setStones(stonesRes.data.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleOpenDialog = (type, mode = 'create', data = {}) => {
    setDialog({ open: true, type, mode, data });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, type: '', mode: 'create', data: {} });
  };

  const handleSave = async () => {
    try {
      const api = dialog.type === 'category' ? categoriesAPI :
                   dialog.type === 'metal' ? metalsAPI : stonesAPI;

      if (dialog.mode === 'create') {
        await api.create(dialog.data);
      } else {
        await api.update(dialog.data.id, dialog.data);
      }
      
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('¿Está seguro de eliminar este elemento?')) return;
    
    try {
      const api = type === 'category' ? categoriesAPI :
                   type === 'metal' ? metalsAPI : stonesAPI;
      await api.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar');
    }
  };

  const renderList = (items, type, fields) => (
    <List>
      {items.map((item) => (
        <ListItem
          key={item.id}
          secondaryAction={
            <>
              <IconButton
                edge="end"
                onClick={() => handleOpenDialog(type, 'edit', item)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                onClick={() => handleDelete(type, item.id)}
              >
                <DeleteIcon />
              </IconButton>
            </>
          }
        >
          <ListItemText
            primary={item.name}
            secondary={fields.map(f => item[f]).filter(Boolean).join(' - ')}
          />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuración
      </Typography>

      <Card>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Categorías" />
          <Tab label="Metales" />
          <Tab label="Piedras" />
        </Tabs>

        <CardContent>
          {tab === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Categorías</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('category')}
                >
                  Nueva Categoría
                </Button>
              </Box>
              {renderList(categories, 'category', ['description'])}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Metales</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('metal')}
                >
                  Nuevo Metal
                </Button>
              </Box>
              {renderList(metals, 'metal', ['purity'])}
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Piedras</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('stone')}
                >
                  Nueva Piedra
                </Button>
              </Box>
              {renderList(stones, 'stone', ['type', 'carat'])}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.mode === 'create' ? 'Nuevo' : 'Editar'} {
            dialog.type === 'category' ? 'Categoría' :
            dialog.type === 'metal' ? 'Metal' : 'Piedra'
          }
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={dialog.data.name || ''}
                onChange={(e) => setDialog({
                  ...dialog,
                  data: { ...dialog.data, name: e.target.value }
                })}
              />
            </Grid>
            {dialog.type === 'category' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción"
                  value={dialog.data.description || ''}
                  onChange={(e) => setDialog({
                    ...dialog,
                    data: { ...dialog.data, description: e.target.value }
                  })}
                />
              </Grid>
            )}
            {dialog.type === 'metal' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Pureza"
                  value={dialog.data.purity || ''}
                  onChange={(e) => setDialog({
                    ...dialog,
                    data: { ...dialog.data, purity: e.target.value }
                  })}
                />
              </Grid>
            )}
            {dialog.type === 'stone' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tipo"
                    value={dialog.data.type || ''}
                    onChange={(e) => setDialog({
                      ...dialog,
                      data: { ...dialog.data, type: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quilates"
                    value={dialog.data.carat || ''}
                    onChange={(e) => setDialog({
                      ...dialog,
                      data: { ...dialog.data, carat: parseFloat(e.target.value) }
                    })}
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Settings;
