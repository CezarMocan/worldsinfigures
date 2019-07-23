import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';

const useStyles = makeStyles({
  root: {
    // width: 250,
    // backgroundColor: 'red'
  },
  input: {
    width: 50,
  },
});

export default function InputSlider(props) {
  const valueToPercent = (value) => {
    const { min, max } = props
    return (value - min) / (max - min) * 100
  }

  const percentToValue = (value) => {
    const { min, max } = props
    return (value / 100) * (max - min) + min
  }

  const classes = useStyles();
  const [value, setValue] = React.useState(valueToPercent(props.initialValue));

  const handleSliderChange = (event, newValue) => {
    const { onValueChange } = props
    setValue(newValue);    
    if (onValueChange) onValueChange(percentToValue(newValue))
  };

  const handleInputChange = event => {
    const { onValueChange } = props
    const newValue = event.target.value === '' ? '' : valueToPercent(Number(event.target.value))
    setValue(newValue);
    if (onValueChange) onValueChange(percentToValue(newValue))
  };

  const handleBlur = () => {
    const { min, max } = props
    if (value < 0) {
      setValue(0);
    } else if (value > 100) {
      setValue(100);
    }
  };

  React.useEffect(() => {
    // action here
    setValue(valueToPercent(props.initialValue))
  }, [props.initialValue]);

  return (
    <div className={classes.root}>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Typography id="input-slider" gutterBottom>
            {props.label}
          </Typography>
        </Grid>
        <Grid item xs>
          <Slider
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.input}
            value={percentToValue(value)}
            margin="dense"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: props.step || 5,
              min: props.min,
              max: props.max,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}

InputSlider.defaultProps = {
  min: 0,
  max: 100,
  step: 5,
  onValueChange: () => {},
  initialValue: 30
}